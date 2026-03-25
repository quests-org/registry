---
name: create-registry-skill
description: Guide for creating effective Agent Skills. Use when you want to create, write, or author a new skill, or asks about skill structure, best practices, or SKILL.md format.
---

# Creating Registry Skills

Skills live in `skills/` and are installed into the workspace on demand. Each skill has scripts the agent runs via CLI.

## Directory Layout

```
skills/skill-name/
├── SKILL.template.md     # Source of truth — contains {{GENERATED_SCRIPT_DOCS}}
├── SKILL.md              # Generated — never edit directly
├── package.json
├── pnpm-lock.yaml
└── scripts/
    └── my-script.ts
```

**`SKILL.md` is generated** from `SKILL.template.md` by running:

```bash
tsx scripts/generate-skill-md.ts --skill skill-name
```

The generator replaces `{{GENERATED_SCRIPT_DOCS}}` with documentation extracted from each script's JSDoc and CAC `--help` output. Always edit `SKILL.template.md`, never `SKILL.md`.

---

## SKILL.template.md

Keep it minimal — script docs are injected automatically:

```markdown
---
name: your-skill-name
description: "..."
---

# Your Skill Name

Brief one-liner about what this skill does.

## Scripts

Each script can also be used programmatically via its exported function.

{{GENERATED_SCRIPT_DOCS}}
```

---

## Writing Effective Descriptions

The description is the only thing the agent sees when deciding whether to load the skill. Max 1024 characters.

- **Focus on user intent**: "Use when the user wants to remove a background" beats "Runs RMBG-1.4 via ONNX."
- **Use imperative phrasing**: "Use when..." / "Activate when..."
- **List trigger scenarios** including cases where the user doesn't name the domain directly.
- **Disambiguate from similar skills** with negative signals if needed.

---

## Script Structure

Scripts use **CAC** for CLI parsing and export a named async function for programmatic use.

```typescript
/**
 * Brief description of what this script does
 * @note Optional note shown as a callout in the generated docs
 */
import { cac } from "cac";
import { pathToFileURL } from "node:url";

export async function doSomething({
  inputPath,
  outputPath,
}: {
  inputPath: string;
  outputPath: string;
}) {
  // ...
  return { outputPath };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const cli = cac("my-script");
  cli.usage("<inputPath>");
  cli.option("--output <path>", "Output file path");
  cli.help();
  const { args, options } = cli.parse();
  if (options.help) process.exit(0);

  if (!args[0]) {
    cli.outputHelp();
    process.exit(1);
  }

  const result = await doSomething({
    inputPath: resolve(args[0]),
    outputPath: resolve(options.output ?? "output.txt"),
  });

  console.log(`Saved to ${relative(process.cwd(), result.outputPath) || "."}`);
}
```

### What gets auto-generated

The generator extracts:

1. **Heading + description** — from the file-level JSDoc comment
2. **Exports** — TypeScript function signatures via the type checker
3. **CLI help** — from running the script with `--help` via CAC
4. **Notes** — from `@note` tags in the file-level JSDoc

So the only things you need to write manually in `SKILL.template.md` are the frontmatter and any context that isn't captured by scripts.

### Output paths

Always log paths **relative to `process.cwd()`**:

```typescript
import { relative, resolve } from "node:path";
const relOutput = relative(process.cwd(), resolve(outputPath)) || ".";
console.log(`Saved to ${relOutput}`);
```

---

## Summary Checklist

### Core Quality

- [ ] Description focuses on user intent, includes trigger scenarios, is under 1024 chars
- [ ] `SKILL.template.md` contains `{{GENERATED_SCRIPT_DOCS}}`
- [ ] `SKILL.md` is generated — run `tsx scripts/generate-skill-md.ts --skill skill-name`

### Scripts

- [ ] File-level JSDoc describes what the script does (becomes the heading description)
- [ ] Use `@note` tags for important caveats (rendered as callouts)
- [ ] Use **CAC** for CLI parsing, not `parseArgs`
- [ ] Export a named async function; guard CLI with `import.meta.url`
- [ ] Log output paths relative to `process.cwd()`
- [ ] Dependencies in `package.json` + `pnpm-lock.yaml`
