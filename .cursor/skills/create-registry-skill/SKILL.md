---
name: create-registry-skill
description: Guide for creating effective Agent Skills. Use when you want to create, write, or author a new skill, or asks about skill structure, best practices, or SKILL.md format.
---

# Creating Skills

Skills are markdown files that teach the agent how to perform specific tasks. They live in `skills/` and are loaded automatically when relevant.

## Before You Begin: Gather Requirements

1. **Purpose and scope**: What specific task or workflow should this skill help with?
2. **Trigger scenarios**: When should the agent automatically apply this skill?
3. **Key domain knowledge**: What specialized information does the agent need?
4. **Output format preferences**: Are there specific templates or formats required?
5. **Existing patterns**: Are there existing examples or conventions to follow?

If you have previous conversation context, infer the skill from what was discussed.

---

## Skill File Structure

### Directory Layout

```
skills/skill-name/ in the repository root
├── SKILL.md              # Required - main instructions
├── reference.md          # Optional - detailed documentation
└── scripts/              # Optional - utility TypeScript scripts
    ├── my-script.ts
    └── lib/
        └── helper.ts
```

### SKILL.md Structure

```markdown
---
name: your-skill-name
description: Brief description of what this skill does and when to use it
---

# Your Skill Name

## Instructions

Clear, step-by-step guidance for the agent.
```

### Required Metadata Fields

| Field         | Requirements                                         | Purpose                                    |
| ------------- | ---------------------------------------------------- | ------------------------------------------ |
| `name`        | Max 64 chars, lowercase letters/numbers/hyphens only | Unique identifier for the skill            |
| `description` | Max 1024 chars, non-empty                            | Helps agent decide when to apply the skill |

---

## Writing Effective Descriptions

The description is **critical** for skill discovery. The agent uses it to decide when to apply your skill.

1. **Write in third person**:
   - ✅ Good: "Processes Excel files and generates reports"
   - ❌ Avoid: "I can help you process Excel files"

2. **Be specific and include trigger terms**:
   - ✅ Good: "Extract text and tables from PDF files. Use when working with PDF files or when the user mentions PDFs, forms, or document extraction."
   - ❌ Vague: "Helps with documents"

3. **Include both WHAT and WHEN**:
   - WHAT: What the skill does (specific capabilities)
   - WHEN: When the agent should use it (trigger scenarios)

---

## Core Authoring Principles

### 1. Concise is Key

The context window is shared with conversation history, other skills, and requests. Every token competes for space.

**Default assumption**: The agent is already very smart. Only add context it doesn't already have.

Challenge each piece of information:

- "Does the agent really need this explanation?"
- "Can I assume the agent knows this?"
- "Does this paragraph justify its token cost?"

### 2. Keep SKILL.md Under 500 Lines

Use progressive disclosure for detailed content.

### 3. Progressive Disclosure

Put essential information in SKILL.md; detailed reference material in separate files that the agent reads only when needed.

```markdown
## Additional resources

- For complete API details, see [reference.md](reference.md)
```

**Keep references one level deep**: link directly from SKILL.md to reference files.

### 4. Set Appropriate Degrees of Freedom

| Freedom Level                     | When to Use                                  | Example                |
| --------------------------------- | -------------------------------------------- | ---------------------- |
| **High** (text instructions)      | Multiple valid approaches, context-dependent | Code review guidelines |
| **Medium** (pseudocode/templates) | Preferred pattern with acceptable variation  | Report generation      |
| **Low** (specific scripts)        | Fragile operations, consistency critical     | File conversions       |

---

## Utility Scripts

Skills can include TypeScript scripts in a `scripts/` directory. CLI-style scripts that take arguments are preferred:

- Can be run directly by the agent, without the need to modify the code
- Versatile, can be used many times without modification
- Can be tested

### Running Scripts

The runtime environment is always Node.js 22+, so all modern Node.js APIs are available.

`tsx` is the best way to execute scripts. When explaining how to use a script, use the following format:

```bash
tsx skills/skill-name/scripts/my-script.ts ./file.txt
```

### Script Structure

Scripts should export their core logic as a named async function **and** include a CLI entrypoint guarded by an `import.meta.url` check. This lets the agent run the script from the terminal or import the function programmatically.

```typescript
import { writeFile } from "node:fs/promises";
import { relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";

export async function doSomething({ inputPath, outputPath }: { inputPath: string; outputPath: string }) {
  // ... implementation ...
  return { outputPath };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      output: { type: "string" },
    },
  });

  const [filePath] = positionals;
  const result = await doSomething({
    inputPath: resolve(filePath),
    outputPath: resolve(values.output ?? "output.txt"),
  });

  const relOutput = relative(process.cwd(), result.outputPath) || ".";
  console.log(`Saved to ${relOutput}`);
}
```

### Output Paths

Scripts run from the project root. Always log paths **relative to `process.cwd()`** so the agent can use them directly — never log absolute paths.

Use `relative()` from `node:path` to convert resolved paths back to relative ones for console output:

```typescript
import { relative, resolve } from "node:path";

const outputPath = resolve(values.output);
await writeFile(outputPath, data);

const relOutput = relative(process.cwd(), outputPath) || ".";
console.log(`Saved to ${relOutput}`);
```

For scripts that generate an output directory (e.g. rendering pages), log the **full relative path** to each file — not just the filename:

```typescript
const relDir = relative(process.cwd(), outputDir) || ".";
console.log(`Saved ${relDir}/page-01.png`);
```

### Documenting Scripts

In the SKILL.md, document each script's CLI usage **and** its exported function. Add an `Export:` line with the function name and parameter signature right after the script heading so the agent knows both options:

````markdown
### `my-script.ts` Does something useful

Export: `doSomething({ inputPath, outputPath })`

```bash
tsx skills/skill-name/scripts/my-script.ts ./input.txt --output ./output.md
```
````

Make clear whether the agent should **execute** the script (most common) or **read** it as reference.

---

## Common Patterns

### Template Pattern

Provide output format templates:

```markdown
## Report structure

Use this template:

\`\`\`markdown
# [Analysis Title]

## Executive summary

[One-paragraph overview]

## Key findings

- Finding 1
- Finding 2
\`\`\`
````

---

## Skill Creation Workflow

### Phase 1: Discovery

Gather information about:

1. The skill's purpose and primary use case
2. Trigger scenarios
3. Any specific requirements or constraints
4. Existing examples or patterns to follow

### Phase 2: Design

1. Draft the skill name (lowercase, hyphens, max 64 chars)
2. Write a specific, third-person description
3. Outline the main sections needed
4. Identify if TypeScript utility scripts are needed

### Phase 3: Implementation

1. Create the directory at `skills/skill-name/` in the repository root
2. Write the SKILL.md file with frontmatter
3. Create any supporting reference files
4. Create any TypeScript utility scripts in `scripts/`

### Phase 4: Verification

1. Verify the SKILL.md is under 500 lines
2. Check that the description is specific and includes trigger terms
3. Ensure consistent terminology throughout
4. Verify all file references are one level deep
5. Confirm scripts use `tsx` and are referenced with full `skills/...` paths

---

## Complete Example

**Directory structure:**

```
skills/image-resize/ in the repository root
├── SKILL.md
└── scripts/
    └── resize.ts
```

**SKILL.md:**

````markdown
---
name: image-resize
description: Resize images to specified dimensions. Use when resizing images, thumbnails, or when the user needs to change image dimensions.
---

# image-resize

Resize images using the `sharp` library.

## Installation Required

```bash
pnpm add sharp
```

## Quick Start

```bash
tsx skills/image-resize/scripts/resize.ts ./photo.jpg
tsx skills/image-resize/scripts/resize.ts ./photo.jpg --width 800
```

## CLI Options

| Argument          | Required | Default | Description       |
| ----------------- | -------- | ------- | ----------------- |
| `<path>`          | Yes      |         | Input image       |
| `--width <px>`    | No       |         | Target width      |
| `--height <px>`   | No       |         | Target height     |
| `--output <path>` | No       | auto    | Output image path |

## Output

Prints the relative output path on success:

```
Resized photo.jpg → photo-resized.jpg (800x600)
```

```

---

## Summary Checklist

Before finalizing a skill, verify:

### Core Quality

- [ ] Description is specific and includes key terms
- [ ] Description includes both WHAT and WHEN
- [ ] Written in third person
- [ ] SKILL.md body is under 500 lines
- [ ] Consistent terminology throughout

### Structure

- [ ] Skill is located at `skills/skill-name/` in the repository root
- [ ] File references are one level deep
- [ ] Progressive disclosure used appropriately
- [ ] No time-sensitive information

### If Including Scripts

- [ ] Scripts are TypeScript (`.ts`) files
- [ ] Scripts export a named async function and guard CLI with `import.meta.url`
- [ ] Each script's `Export:` line is documented in SKILL.md
- [ ] Scripts are run with `tsx`, never `node` or `python`
- [ ] Script paths use `skills/skill-name/scripts/...`
- [ ] Required packages are documented with `pnpm add`
- [ ] Scripts log paths relative to `process.cwd()`, never absolute
- [ ] Error handling is explicit and helpful
```
````
