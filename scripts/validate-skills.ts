#!/usr/bin/env tsx

import { readFileSync, readdirSync } from "fs";
import { join } from "path";
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
