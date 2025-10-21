#!/usr/bin/env tsx

import { readFileSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';

const TEMPLATES_DIR = join(process.cwd(), 'templates');
const BASIC_GITIGNORE_PATH = join(TEMPLATES_DIR, 'basic', '.gitignore');

interface CheckResult {
  template: string;
  hasGitignore: boolean;
  hasRequiredContent: boolean;
  missingLines: string[];
}

function getRequiredGitignoreContent(): string {
  if (!existsSync(BASIC_GITIGNORE_PATH)) {
    throw new Error(`Basic .gitignore not found at ${BASIC_GITIGNORE_PATH}`);
  }

  return readFileSync(BASIC_GITIGNORE_PATH, 'utf-8');
}

function checkTemplate(templateName: string): CheckResult {
  const gitignorePath = join(TEMPLATES_DIR, templateName, '.gitignore');
  const hasGitignore = existsSync(gitignorePath);

  if (!hasGitignore) {
    return {
      template: templateName,
      hasGitignore: false,
      hasRequiredContent: false,
      missingLines: ['No .gitignore file found']
    };
  }

  const templateContent = readFileSync(gitignorePath, 'utf-8');
  const requiredContent = getRequiredGitignoreContent();

  // Split into lines and normalize whitespace
  const requiredLines = requiredContent
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);

  const templateLines = templateContent
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);

  const missingLines: string[] = [];

  for (const requiredLine of requiredLines) {
    if (!templateLines.includes(requiredLine)) {
      missingLines.push(requiredLine);
    }
  }

  return {
    template: templateName,
    hasGitignore: true,
    hasRequiredContent: missingLines.length === 0,
    missingLines
  };
}

function main() {
  console.log('🔍 Checking .gitignore files in all templates...\n');

  // Get all template directories (excluding empty template)
  const templates = readdirSync(TEMPLATES_DIR, { withFileTypes: true })
    .filter((dirent: any) => dirent.isDirectory())
    .map((dirent: any) => dirent.name)
    .filter(name => name !== 'empty')
    .sort();

  const results: CheckResult[] = [];

  for (const template of templates) {
    const result = checkTemplate(template);
    results.push(result);

    if (result.hasRequiredContent) {
      console.log(`✅ ${template} - All required .gitignore content present`);
    } else {
      console.log(`❌ ${template} - Missing required .gitignore content`);
      if (result.missingLines.length > 0) {
        console.log(`   Missing lines: ${result.missingLines.slice(0, 3).join(', ')}${result.missingLines.length > 3 ? '...' : ''}`);
      }
    }
  }

  const passed = results.filter(r => r.hasRequiredContent).length;
  const failed = results.length - passed;
  const total = results.length;
  const percentage = Math.round((passed / total) * 100);

  console.log(`\n📊 Summary:`);
  console.log(`   Templates checked: ${total}`);
  console.log(`   Passed: ${passed}`);
  console.log(`   Failed: ${failed}`);
  console.log(`   Success rate: ${percentage}%`);

  if (percentage !== 100) {
    console.log(`\n❌ Not all templates have the required .gitignore content!`);
    process.exit(1);
  } else {
    console.log(`\n✅ All templates have the required .gitignore content!`);
    process.exit(0);
  }
}

main();
