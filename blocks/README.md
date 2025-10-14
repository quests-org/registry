# Blocks System

The blocks system provides reusable components that can be applied to any project in the quests-registry workspace. Each block contains:

- **Source files** (`src/`) - Files that will be copied to the target project
- **Codemods** (`codemods/`) - [jscodeshift](https://github.com/facebook/jscodeshift) transformations to modify existing code
- **Dependencies** (`package.json`) - NPM packages that will be added to the target project

## Usage

### List Available Blocks

```bash
npx tsx scripts/list-blocks.ts
```

### Apply a Block

```bash
npx tsx scripts/apply-block.ts <block-name> <target-project-path>
```

**Examples:**

```bash
# Apply AI block to an app
npx tsx scripts/apply-block.ts ai templates/my-app

# Skip existing files (won't overwrite)
npx tsx scripts/apply-block.ts ai templates/my-app --skip-existing
```

## Creating New Blocks

1. Create a new directory in `blocks/` with your block name
2. Add a `package.json` with:
   - `name`: `quests-block-<name>`
   - `description`: Description of what the block provides
   - `dependencies`: NPM packages to add to target projects

3. Add source files in `src/` directory (will be copied to target project)
4. Add codemods in `codemods/` directory (optional)
   - Use [jscodeshift](https://github.com/facebook/jscodeshift) format
   - Files should end in `.js` or `.ts`
   - Will be automatically run on target project's `src/` directory

### Block Structure

```
blocks/my-block/
├── package.json          # Block metadata and dependencies
├── src/                  # Files to copy to target project
│   └── server/
│       └── rpc/
│           └── my-feature.ts
└── codemods/             # Code transformations (optional)
    └── add-my-feature.js
```

### Example Codemod

```javascript
// codemods/add-my-feature.js
module.exports = function transformer(fileInfo, api) {
  const j = api.jscodeshift;
  const root = j(fileInfo.source);
  
  // Find and modify router exports
  const routerExports = root.find(j.ExportNamedDeclaration, {
    declaration: {
      type: 'VariableDeclaration',
      declarations: [{
        id: { name: 'router' }
      }]
    }
  });
  
  // Add import and modify router...
  
  return root.toSource({
    quote: 'double',
    reuseParsers: true
  });
};
```

## How It Works

1. **File Copying**: All files in the block's `src/` directory are copied to the target project
2. **Dependency Addition**: Dependencies from the block's `package.json` are added to the target project
3. **Code Transformation**: Codemods are run using jscodeshift to modify existing files
4. **TypeScript**: All codemods run with TypeScript/TSX parser support

The system is designed to be idempotent - running the same block multiple times should be safe and only add missing pieces.
