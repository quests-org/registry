#!/usr/bin/env tsx

import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { promisify } from "node:util";
import * as prettier from "prettier";
import ts from "typescript";

const execFileAsync = promisify(execFile);

const SKILLS_DIR = join(process.cwd(), "skills");
const PLACEHOLDER = "{{GENERATED_SCRIPT_DOCS}}";

function parseArgs() {
  const args = process.argv.slice(2);
  const checkOnly = args.includes("--check");
  const skillIndex = args.indexOf("--skill");
  const skillName =
    skillIndex >= 0 && skillIndex + 1 < args.length
      ? args[skillIndex + 1]
      : undefined;
  return { checkOnly, skillName };
}

interface FileJsDoc {
  description: string | undefined;
  notes: string[];
}

function getFileJsDoc(scriptPath: string): FileJsDoc {
  const sourceText = ts.sys.readFile(scriptPath) ?? "";
  const sourceFile = ts.createSourceFile(
    scriptPath,
    sourceText,
    ts.ScriptTarget.ES2022,
    true,
  );

  for (const statement of sourceFile.statements) {
    const jsDocNodes = (statement as ts.Node & { jsDoc?: ts.JSDoc[] }).jsDoc;
    if (!jsDocNodes || jsDocNodes.length === 0) continue;

    const jsDoc = jsDocNodes[0];
    const description =
      typeof jsDoc.comment === "string"
        ? jsDoc.comment.trim() || undefined
        : jsDoc.comment
            ?.map((p) => ("text" in p ? p.text : ""))
            .join("")
            .trim() || undefined;

    const notes: string[] = [];
    for (const tag of jsDoc.tags ?? []) {
      if (tag.tagName.text === "note") {
        const noteText =
          typeof tag.comment === "string"
            ? tag.comment.trim()
            : (tag.comment
                ?.map((p) => ("text" in p ? p.text : ""))
                .join("")
                .trim() ?? "");
        if (noteText) notes.push(noteText);
      }
    }

    if (description || notes.length > 0) {
      return { description, notes };
    }
  }

  return { description: undefined, notes: [] };
}

function getExportedFunctionSignatures(scriptPath: string) {
  const program = ts.createProgram([scriptPath], {
    allowImportingTsExtensions: true,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    noEmit: true,
    skipLibCheck: true,
    strict: true,
    target: ts.ScriptTarget.ES2022,
  });
  const checker = program.getTypeChecker();
  const sourceFile = program.getSourceFile(scriptPath);
  if (!sourceFile) {
    return [];
  }

  const moduleSymbol = checker.getSymbolAtLocation(sourceFile);
  if (!moduleSymbol) {
    return [];
  }

  const exports = checker
    .getExportsOfModule(moduleSymbol)
    .sort((a, b) => a.getName().localeCompare(b.getName()));
  const signatures: string[] = [];

  for (const exportSymbol of exports) {
    const declaration =
      exportSymbol.valueDeclaration ?? exportSymbol.declarations?.[0];
    if (!declaration) {
      continue;
    }

    const symbolType = checker.getTypeOfSymbolAtLocation(
      exportSymbol,
      declaration,
    );
    const callSignatures = symbolType.getCallSignatures();
    if (callSignatures.length === 0) {
      continue;
    }

    for (const callSignature of callSignatures) {
      const signatureText = checker.signatureToString(
        callSignature,
        declaration,
        ts.TypeFormatFlags.NoTruncation,
      );
      // Remove absolute path imports
      const simplified = signatureText.replace(
        /import\("[^"]*"\)\.(\w+)/g,
        "$1",
      );
      signatures.push(`${exportSymbol.getName()}${simplified}`);
    }
  }

  return signatures;
}

async function buildHelpFromRuntime({
  relativeScriptPath,
  skillPath,
}: {
  relativeScriptPath: string;
  skillPath: string;
}) {
  const jitiBin = join(process.cwd(), "node_modules/.bin/jiti");
  const result = await execFileAsync(jitiBin, [relativeScriptPath, "--help"], {
    cwd: skillPath,
    encoding: "utf-8",
  }).catch((err: { stderr: string; stdout: string; code: number }) => err);

  const stdout = (result.stdout ?? "").trim();
  const stderr = (result.stderr ?? "").trim();
  const output = [stdout, stderr].filter(Boolean).join("\n").trim();

  if (
    output.length > 0 &&
    (output.includes("Usage:") || output.includes("Options:"))
  ) {
    return output;
  }
  return ["Usage:", `  tsx ${relativeScriptPath} --help`].join("\n");
}

function formatScriptDocBlock({
  description,
  exportedSignatures,
  helpOutput,
  notes,
  scriptName,
}: {
  description?: string;
  exportedSignatures: string[];
  helpOutput: string;
  notes: string[];
  scriptName: string;
}) {
  const heading = description
    ? `### \`${scriptName}\` ${description}`
    : `### \`${scriptName}\``;

  const exportsLine =
    exportedSignatures.length > 0 ? "Exports:" : "Exports: (none)";
  const exportLines =
    exportedSignatures.length > 0
      ? exportedSignatures.map((signature) => `- \`${signature}\``)
      : [];

  const noteBlock =
    notes.length > 0
      ? "\n\n> [!NOTE]\n" + notes.map((n) => `> ${n}`).join("\n")
      : "";

  return (
    [
      heading,
      "",
      exportsLine,
      ...exportLines,
      "",
      "```text",
      helpOutput,
      "```",
    ].join("\n") + noteBlock
  );
}

async function generateScriptDocsSection(skillPath: string) {
  const scriptsDir = join(skillPath, "scripts");
  if (!existsSync(scriptsDir)) {
    return "";
  }

  const entries = await readdir(scriptsDir, { withFileTypes: true });
  const scriptFiles = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".ts"))
    .map((entry) => entry.name)
    .sort();

  const blocks = await Promise.all(
    scriptFiles.map(async (scriptName) => {
      const scriptPath = join(scriptsDir, scriptName);
      const relativeScriptPath = join("scripts", scriptName);
      const [exportedSignatures, helpOutput] = await Promise.all([
        Promise.resolve(getExportedFunctionSignatures(scriptPath)),
        buildHelpFromRuntime({ relativeScriptPath, skillPath }),
      ]);
      const { description, notes } = getFileJsDoc(scriptPath);
      return formatScriptDocBlock({
        description,
        exportedSignatures,
        helpOutput,
        notes,
        scriptName,
      });
    }),
  );

  return blocks.join("\n\n");
}

async function generateSkillMarkdown({
  checkOnly,
  skillName,
}: {
  checkOnly: boolean;
  skillName: string;
}) {
  const skillPath = join(SKILLS_DIR, skillName);
  const templatePath = join(skillPath, "SKILL.template.md");
  const skillMdPath = join(skillPath, "SKILL.md");
  const template = await readFile(templatePath, "utf-8");
  if (!template.includes(PLACEHOLDER)) {
    throw new Error(`${skillName}: template missing ${PLACEHOLDER}`);
  }

  const generatedScriptDocs = await generateScriptDocsSection(skillPath);
  const raw = template.replace(PLACEHOLDER, generatedScriptDocs);
  const generated = await prettier.format(raw, { filepath: skillMdPath });
  const existing = await readFile(skillMdPath, "utf-8").catch(() => "");

  if (checkOnly) {
    if (generated !== existing) {
      throw new Error(`${skillName}: SKILL.md is out of date`);
    }
    return;
  }

  await writeFile(skillMdPath, generated, "utf-8");
}

async function main() {
  const { checkOnly, skillName } = parseArgs();
  const skillEntries = await readdir(SKILLS_DIR, { withFileTypes: true });
  const allSkillNames = skillEntries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
  const targetSkills = skillName ? [skillName] : allSkillNames;
  const templatedSkills = targetSkills.filter((name) =>
    existsSync(join(SKILLS_DIR, name, "SKILL.template.md")),
  );

  await Promise.all(
    templatedSkills.map(async (name) => {
      await generateSkillMarkdown({ checkOnly, skillName: name });
      console.log(`${checkOnly ? "Checked" : "Generated"} ${name}/SKILL.md`);
    }),
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
