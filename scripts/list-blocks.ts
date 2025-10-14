import { promises as fs } from "node:fs";
import * as path from "node:path";

type AbsolutePath = string;

function absolutePathJoin(
  basePath: AbsolutePath,
  ...segments: string[]
): AbsolutePath {
  return path.join(basePath, ...segments) as AbsolutePath;
}

async function getBlockInfo(blockPath: AbsolutePath) {
  const packageJsonPath = absolutePathJoin(blockPath, "package.json");

  try {
    const content = await fs.readFile(packageJsonPath, "utf-8");
    const packageJson = JSON.parse(content);
    const srcPath = absolutePathJoin(blockPath, "src");
    const files: string[] = [];

    try {
      const srcStats = await fs.stat(srcPath);
      if (srcStats.isDirectory()) {
        const findFiles = async (dir: string, prefix = ""): Promise<void> => {
          const entries = await fs.readdir(dir, { withFileTypes: true });
          for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            const relativePath = prefix
              ? `${prefix}/${entry.name}`
              : entry.name;

            if (entry.isDirectory()) {
              await findFiles(fullPath, relativePath);
            } else if (entry.name.endsWith(".ts")) {
              files.push(relativePath);
            }
          }
        };

        await findFiles(srcPath);
      }
    } catch {}
    const codemodsPath = absolutePathJoin(blockPath, "codemods");
    const codemods: string[] = [];

    try {
      const codemodStats = await fs.stat(codemodsPath);
      if (codemodStats.isDirectory()) {
        const entries = await fs.readdir(codemodsPath);
        for (const entry of entries) {
          if (entry.endsWith(".js") || entry.endsWith(".ts")) {
            codemods.push(entry);
          }
        }
      }
    } catch {}

    return {
      name: packageJson.name,
      description: packageJson.description || "No description",
      version: packageJson.version,
      files,
      codemods,
      dependencies: Object.keys(packageJson.dependencies || {}),
    };
  } catch (error) {
    return null;
  }
}

async function main(): Promise<void> {
  const projectRoot = process.cwd();
  const blocksDir = absolutePathJoin(projectRoot, "blocks");

  try {
    const entries = await fs.readdir(blocksDir, { withFileTypes: true });
    const blocks = entries.filter((entry) => entry.isDirectory());

    if (blocks.length === 0) {
      console.log("No blocks found in the blocks directory.");
      return;
    }

    console.log("📦 Available Blocks\n");

    for (const block of blocks) {
      const blockPath = absolutePathJoin(blocksDir, block.name);
      const info = await getBlockInfo(blockPath);

      if (info) {
        console.log(`🔷 ${info.name}`);
        console.log(`   Description: ${info.description}`);
        console.log(`   Version: ${info.version}`);

        if (info.files.length > 0) {
          console.log(`   Files: ${info.files.join(", ")}`);
        }

        if (info.codemods.length > 0) {
          console.log(`   Codemods: ${info.codemods.join(", ")}`);
        }

        if (info.dependencies.length > 0) {
          console.log(`   Dependencies: ${info.dependencies.join(", ")}`);
        }

        console.log("");
      } else {
        console.log(
          `⚠️  ${block.name} (invalid block - missing or invalid package.json)`
        );
        console.log("");
      }
    }

    console.log("📖 Usage:");
    console.log("   Apply any block:");
    console.log(
      "   tsx scripts/apply-block.ts <block-name> <target-project-path>"
    );
    console.log("");
    console.log("   Examples:");
    console.log("   tsx scripts/apply-block.ts ai templates/my-app");
    console.log("   tsx scripts/apply-block.ts ai templates/my-app --skip-existing");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      console.log(
        "❌ Blocks directory not found. Make sure you're in the project root."
      );
    } else {
      console.error(
        `❌ Error listing blocks: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
    process.exit(1);
  }
}

main().catch(console.error);
