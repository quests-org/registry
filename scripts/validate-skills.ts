#!/usr/bin/env tsx

import { existsSync, readFileSync, readdirSync } from "fs";
import { spawnSync } from "node:child_process";
import { basename, join } from "path";
import { estimateTokenCount } from "tokenx";

const SKILLS_DIR = join(process.cwd(), "skills");

const NAME_MAX_LENGTH = 64;
const DESCRIPTION_MAX_LENGTH = 1024;
const COMPATIBILITY_MAX_LENGTH = 500;
const SKILL_MD_MAX_LINES = 500;
const SKILL_MD_MAX_TOKENS = 5000;
const KEBAB_CASE_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

interface Frontmatter {
  name?: string;
  description?: string;
  compatibility?: string;
}

interface ValidationError {
  skill: string;
  errors: string[];
}

function parseFrontmatter(content: string): Frontmatter | null {
  if (!content.startsWith("---")) return null;
  const end = content.indexOf("\n---", 3);
  if (end === -1) return null;
  const yaml = content.slice(4, end);
  const result: Frontmatter = {};

  for (const line of yaml.split("\n")) {
    const match = line.match(/^(\w[\w-]*):\s*(.*)/);
    if (!match) continue;
    const [, key, value] = match;
    if (key === "name" || key === "description" || key === "compatibility") {
      result[key] = value.replace(/^["']|["']$/g, "").trim();
    }
  }

  return result;
}

function validatePackageJson(folderName: string, skillPath: string): string[] {
  const errors: string[] = [];
  const pkgPath = join(skillPath, "package.json");

  if (!existsSync(pkgPath)) return errors;

  let pkg: Record<string, unknown>;
  try {
    pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
  } catch {
    errors.push("package.json is not valid JSON");
    return errors;
  }

  const expectedName = `@quests/skill-${folderName}`;
  if (pkg.name !== expectedName) {
    errors.push(
      `package.json "name" is "${pkg.name}", expected "${expectedName}"`,
    );
  }

  if (pkg.version !== "0.0.0") {
    errors.push(`package.json "version" is "${pkg.version}", expected "0.0.0"`);
  }

  if (pkg.private !== true) {
    errors.push(`package.json "private" must be true`);
  }

  if (pkg.type !== "module") {
    errors.push(`package.json "type" is "${pkg.type}", expected "module"`);
  }

  const scripts = pkg.scripts as Record<string, string> | undefined;
  if (!scripts?.["check:types"]) {
    errors.push(`package.json missing "check:types" script`);
  } else if (scripts["check:types"] !== "tsc --noEmit") {
    errors.push(
      `package.json "check:types" script is "${scripts["check:types"]}", expected "tsc --noEmit"`,
    );
  }

  return errors;
}

const CANONICAL_TSCONFIG_COMPILER_OPTIONS = {
  allowImportingTsExtensions: true,
  esModuleInterop: true,
  isolatedModules: true,
  lib: ["ES2023"],
  module: "ESNext",
  moduleResolution: "Bundler",
  noEmit: true,
  noUncheckedSideEffectImports: true,
  skipLibCheck: true,
  strict: true,
  target: "ES2022",
};

const REQUIRED_INCLUDE_ENTRIES = ["scripts/**/*.ts", "tests/**/*.ts"];

function validateTsconfig(skillPath: string): string[] {
  const tsconfigPath = join(skillPath, "tsconfig.json");
  if (!existsSync(tsconfigPath)) {
    return ["Missing tsconfig.json"];
  }

  let tsconfig: {
    compilerOptions?: Record<string, unknown>;
    include?: string[];
  };
  try {
    tsconfig = JSON.parse(readFileSync(tsconfigPath, "utf-8"));
  } catch {
    return ["tsconfig.json is not valid JSON"];
  }

  const errors: string[] = [];

  if (
    JSON.stringify(tsconfig.compilerOptions) !==
    JSON.stringify(CANONICAL_TSCONFIG_COMPILER_OPTIONS)
  ) {
    errors.push("tsconfig.json compilerOptions do not match canonical config");
  }

  for (const entry of REQUIRED_INCLUDE_ENTRIES) {
    if (!tsconfig.include?.includes(entry)) {
      errors.push(`tsconfig.json include missing "${entry}"`);
    }
  }

  return errors;
}

const SKILL_PATH_RE_CACHE = new Map<string, RegExp>();

function getSkillPathRe(folderName: string): RegExp {
  let re = SKILL_PATH_RE_CACHE.get(folderName);
  if (!re) {
    const escaped = folderName.replace(/[-]/g, "\\-");
    re = new RegExp(`skills/${escaped}/`);
    SKILL_PATH_RE_CACHE.set(folderName, re);
  }
  return re;
}

function validateNoAbsoluteSkillPaths(
  folderName: string,
  skillPath: string,
): string[] {
  const errors: string[] = [];
  const re = getSkillPathRe(folderName);

  const dirsToCheck = ["scripts"];
  const filesToCheck: string[] = [join(skillPath, "SKILL.md")];

  for (const dir of dirsToCheck) {
    const dirPath = join(skillPath, dir);
    if (!existsSync(dirPath)) continue;
    const files = readdirSync(dirPath, { withFileTypes: true })
      .filter((f) => f.isFile())
      .map((f) => join(dirPath, f.name));
    filesToCheck.push(...files);
  }

  for (const filePath of filesToCheck) {
    if (!existsSync(filePath)) continue;
    const source = readFileSync(filePath, "utf-8");
    if (re.test(source)) {
      const relative = filePath.slice(skillPath.length + 1);
      errors.push(
        `${relative}: references "skills/${folderName}/" (use skill-relative paths instead)`,
      );
    }
  }

  return errors;
}

const CLI_USAGE_RE = /cli\.usage\s*\(/;
const CAC_RE = /\bcac\s*\(/;

function validateScriptCliUsage(skillPath: string): string[] {
  const scriptsDir = join(skillPath, "scripts");
  if (!existsSync(scriptsDir)) return [];

  const errors: string[] = [];
  const files = readdirSync(scriptsDir, { withFileTypes: true })
    .filter((f) => f.isFile() && f.name.endsWith(".ts"))
    .map((f) => join(scriptsDir, f.name));

  for (const filePath of files) {
    const source = readFileSync(filePath, "utf-8");
    if (CAC_RE.test(source) && !CLI_USAGE_RE.test(source)) {
      const relative = filePath.slice(skillPath.length + 1);
      errors.push(`${relative}: missing cli.usage(...) call`);
    }
  }

  return errors;
}

function validateGeneratedSkillMd(skillPath: string): string[] {
  const templatePath = join(skillPath, "SKILL.template.md");
  const skillName = basename(skillPath);

  if (!existsSync(templatePath) || !skillName) {
    return [];
  }

  const result = spawnSync(
    "pnpm",
    [
      "exec",
      "jiti",
      "scripts/generate-skill-md.ts",
      "--check",
      "--skill",
      skillName,
    ],
    {
      cwd: process.cwd(),
      encoding: "utf-8",
    },
  );

  if (result.status === 0) {
    return [];
  }

  const errorOutput = [result.stdout.trim(), result.stderr.trim()]
    .filter(Boolean)
    .join("\n");

  return [
    `Generated SKILL.md check failed${errorOutput ? `: ${errorOutput}` : ""}`,
  ];
}

function validateSkill(folderName: string): string[] {
  const errors: string[] = [];
  const skillPath = join(SKILLS_DIR, folderName);
  const skillMdPath = join(skillPath, "SKILL.md");

  let content: string;
  try {
    content = readFileSync(skillMdPath, "utf-8");
  } catch {
    errors.push("Missing SKILL.md");
    return errors;
  }

  const lines = content.split("\n");
  if (lines.length > SKILL_MD_MAX_LINES) {
    errors.push(
      `SKILL.md has ${lines.length} lines (max ${SKILL_MD_MAX_LINES})`,
    );
  }

  const tokens = estimateTokenCount(content);
  if (tokens > SKILL_MD_MAX_TOKENS) {
    errors.push(`SKILL.md is ~${tokens} tokens (max ${SKILL_MD_MAX_TOKENS})`);
  }

  if (!KEBAB_CASE_RE.test(folderName)) {
    errors.push(`Folder name "${folderName}" is not kebab-case`);
  }

  const fm = parseFrontmatter(content);
  if (!fm) {
    errors.push("Missing or invalid YAML frontmatter");
    return errors;
  }

  if (!fm.name) {
    errors.push('Missing required "name" field');
  } else {
    if (fm.name !== folderName) {
      errors.push(
        `"name" field "${fm.name}" does not match folder name "${folderName}"`,
      );
    }
    if (!KEBAB_CASE_RE.test(fm.name)) {
      errors.push(
        `"name" field "${fm.name}" is not kebab-case (lowercase letters, numbers, hyphens only; no leading/trailing/consecutive hyphens)`,
      );
    }
    if (fm.name.length > NAME_MAX_LENGTH) {
      errors.push(
        `"name" is ${fm.name.length} characters (max ${NAME_MAX_LENGTH})`,
      );
    }
  }

  if (!fm.description) {
    errors.push('Missing required "description" field');
  } else if (fm.description.length > DESCRIPTION_MAX_LENGTH) {
    errors.push(
      `"description" is ${fm.description.length} characters (max ${DESCRIPTION_MAX_LENGTH})`,
    );
  }

  if (
    fm.compatibility !== undefined &&
    fm.compatibility.length > COMPATIBILITY_MAX_LENGTH
  ) {
    errors.push(
      `"compatibility" is ${fm.compatibility.length} characters (max ${COMPATIBILITY_MAX_LENGTH})`,
    );
  }

  const hasScripts = existsSync(join(skillPath, "scripts"));
  if (hasScripts && !existsSync(join(skillPath, "package.json"))) {
    errors.push(
      "Missing package.json (required when scripts/ directory exists)",
    );
  }

  errors.push(...validatePackageJson(folderName, skillPath));
  errors.push(...validateTsconfig(skillPath));
  errors.push(...validateNoAbsoluteSkillPaths(folderName, skillPath));
  errors.push(...validateScriptCliUsage(skillPath));
  errors.push(...validateGeneratedSkillMd(skillPath));

  return errors;
}

function main() {
  const skillFolders = readdirSync(SKILLS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();

  const results: ValidationError[] = [];
  const namesSeen = new Map<string, string>();

  for (const folder of skillFolders) {
    const errors = validateSkill(folder);

    const skillMdPath = join(SKILLS_DIR, folder, "SKILL.md");
    try {
      const content = readFileSync(skillMdPath, "utf-8");
      const fm = parseFrontmatter(content);
      if (fm?.name) {
        const existing = namesSeen.get(fm.name);
        if (existing) {
          errors.push(
            `Duplicate skill name "${fm.name}" (also used by "${existing}")`,
          );
        } else {
          namesSeen.set(fm.name, folder);
        }
      }
    } catch {
      // already reported as missing SKILL.md
    }

    results.push({ skill: folder, errors });
  }

  let hasFailures = false;

  for (const { skill, errors } of results) {
    if (errors.length === 0) {
      console.log(`✅ ${skill}`);
    } else {
      hasFailures = true;
      console.log(`❌ ${skill}`);
      for (const error of errors) {
        console.log(`   • ${error}`);
      }
    }
  }

  const passed = results.filter((r) => r.errors.length === 0).length;
  const total = results.length;

  console.log(`\n${passed}/${total} skills passed validation`);

  if (hasFailures) {
    process.exit(1);
  }
}

main();
