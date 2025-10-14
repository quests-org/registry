import { promises as fs } from "node:fs";
import * as path from "node:path";
import { execSync } from "node:child_process";

type AbsolutePath = string;

function absolutePathJoin(
  basePath: AbsolutePath,
  ...segments: string[]
): AbsolutePath {
  return path.join(basePath, ...segments) as AbsolutePath;
}

async function fileExists(filePath: AbsolutePath): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function ensureDirectory(dirPath: AbsolutePath): Promise<void> {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "EEXIST") {
      throw error;
    }
  }
}

async function copyDirectory(
  sourceDir: AbsolutePath,
  targetDir: AbsolutePath,
  options: { skipIfExists?: boolean } = {}
): Promise<void> {
  const entries = await fs.readdir(sourceDir, { withFileTypes: true });

  await ensureDirectory(targetDir);

  for (const entry of entries) {
    const sourcePath = absolutePathJoin(sourceDir, entry.name);
    const targetPath = absolutePathJoin(targetDir, entry.name);

    if (entry.isDirectory()) {
      await copyDirectory(sourcePath, targetPath, options);
    } else {
      if (options.skipIfExists && (await fileExists(targetPath))) {
        console.log(`⚠️  Skipping ${entry.name} (already exists)`);
        continue;
      }
      await fs.copyFile(sourcePath, targetPath);
      console.log(`✅ Copied ${entry.name}`);
    }
  }
}

async function getBlockInfo(blockPath: AbsolutePath) {
  const packageJsonPath = absolutePathJoin(blockPath, "package.json");

  try {
    const content = await fs.readFile(packageJsonPath, "utf-8");
    const packageJson = JSON.parse(content);

    return {
      name: packageJson.name,
      dependencies: packageJson.dependencies || {},
      devDependencies: packageJson.devDependencies || {},
    };
  } catch (error) {
    throw new Error(
      `Failed to read block package.json: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

async function addDependencies(
  targetProjectDir: AbsolutePath,
  dependencies: Record<string, string>,
  type: "dependencies" | "devDependencies" = "dependencies"
): Promise<void> {
  const packageJsonPath = absolutePathJoin(targetProjectDir, "package.json");

  if (!(await fileExists(packageJsonPath))) {
    console.log(`⚠️  package.json not found in ${targetProjectDir}`);
    return;
  }

  const packageContent = await fs.readFile(packageJsonPath, "utf-8");
  const packageJson = JSON.parse(packageContent);

  let added = false;
  const targetDeps = packageJson[type] || {};

  for (const [dep, version] of Object.entries(dependencies)) {
    if (!targetDeps[dep]) {
      targetDeps[dep] = version;
      added = true;
      console.log(`✅ Added ${dep}@${version} to ${type}`);
    } else {
      console.log(`⚠️  ${dep} already exists in ${type}`);
    }
  }

  if (added) {
    packageJson[type] = targetDeps;
    await fs.writeFile(
      packageJsonPath,
      JSON.stringify(packageJson, null, 2) + "\n"
    );
  }
}

async function runCodemods(
  blockPath: AbsolutePath,
  targetProjectDir: AbsolutePath
): Promise<void> {
  const codemodsDir = absolutePathJoin(blockPath, "codemods");

  if (!(await fileExists(codemodsDir))) {
    console.log("📝 No codemods directory found, skipping transformations");
    return;
  }

  const codemodFiles = await fs.readdir(codemodsDir);
  const jsCodemods = codemodFiles.filter(
    (file) => file.endsWith(".js") || file.endsWith(".ts")
  );

  if (jsCodemods.length === 0) {
    console.log("📝 No codemods found, skipping transformations");
    return;
  }

  console.log(`📝 Running ${jsCodemods.length} codemod(s)...`);

  for (const codemodFile of jsCodemods) {
    const codemodPath = absolutePathJoin(codemodsDir, codemodFile);
    console.log(`   Running ${codemodFile}...`);

    try {
      let jscodeshiftPath: string;
      try {
        const blockNodeModules = absolutePathJoin(
          blockPath,
          "node_modules/.bin/jscodeshift"
        );
        if (await fileExists(blockNodeModules)) {
          jscodeshiftPath = blockNodeModules;
        } else {
          jscodeshiftPath = "npx jscodeshift";
        }
      } catch {
        jscodeshiftPath = "npx jscodeshift";
      }
      const srcDir = absolutePathJoin(targetProjectDir, "src");
      if (await fileExists(srcDir)) {
        const command = `${jscodeshiftPath} -t "${codemodPath}" --parser=tsx --extensions=ts,tsx "${srcDir}" || true`;

        execSync(command, {
          cwd: targetProjectDir,
          stdio: ["pipe", "pipe", "pipe"],
        });

        console.log(`   ✅ Applied ${codemodFile}`);
      } else {
        console.log(`   ⚠️  No src directory found in target project`);
      }
    } catch (error) {
      console.log(
        `   ⚠️  Failed to run ${codemodFile}: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }
}

function parseArguments() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error(
      "Usage: tsx scripts/apply-block.ts <block-name> <target-project-path>"
    );
    console.error("Example: tsx scripts/apply-block.ts ai templates/my-app");
    console.error("\nAvailable blocks:");
    console.error("  ai - AI models and utilities");
    process.exit(1);
  }

  if (args.length === 1) {
    console.error("Please provide a target project path.");
    console.error(
      "Usage: tsx scripts/apply-block.ts <block-name> <target-project-path>"
    );
    console.error("Example: tsx scripts/apply-block.ts ai templates/my-app");
    process.exit(1);
  }

  return {
    blockName: args[0],
    targetProjectPath: args[1],
    options: {
      skipExisting: args.includes("--skip-existing"),
    },
  };
}

async function main(): Promise<void> {
  const { blockName, targetProjectPath, options } = parseArguments();

  const projectRoot = process.cwd();
  const blockDir = absolutePathJoin(projectRoot, "blocks", blockName);
  const targetDir = path.isAbsolute(targetProjectPath)
    ? (targetProjectPath as AbsolutePath)
    : absolutePathJoin(projectRoot, targetProjectPath);
  if (!(await fileExists(blockDir))) {
    console.error(`❌ Block '${blockName}' does not exist in blocks directory`);
    console.error("Available blocks:");
    try {
      const blocksDir = absolutePathJoin(projectRoot, "blocks");
      const blocks = await fs.readdir(blocksDir, { withFileTypes: true });
      for (const block of blocks.filter((b) => b.isDirectory())) {
        console.error(`  ${block.name}`);
      }
    } catch {
      console.error("  No blocks directory found");
    }
    process.exit(1);
  }
  if (!(await fileExists(targetDir))) {
    console.error(`❌ Target directory does not exist: ${targetDir}`);
    process.exit(1);
  }
  const srcDir = absolutePathJoin(targetDir, "src");
  if (!(await fileExists(srcDir))) {
    console.error(
      `❌ Target directory is not a valid project (missing src directory): ${targetDir}`
    );
    process.exit(1);
  }

  console.log(`🚀 Applying '${blockName}' block to: ${targetDir}`);

  try {
    const blockInfo = await getBlockInfo(blockDir);
    console.log(`📦 Block: ${blockInfo.name}`);
    const blockSrcDir = absolutePathJoin(blockDir, "src");
    if (await fileExists(blockSrcDir)) {
      console.log("\n📂 Copying source files...");
      const targetSrcDir = absolutePathJoin(targetDir, "src");
      await copyDirectory(blockSrcDir, targetSrcDir, {
        skipIfExists: options.skipExisting,
      });
    } else {
      console.log("📂 No src directory found in block, skipping file copy");
    }
    if (Object.keys(blockInfo.dependencies).length > 0) {
      console.log("\n📦 Adding dependencies...");
      await addDependencies(targetDir, blockInfo.dependencies, "dependencies");
    }
    console.log("\n🔧 Running codemods...");
    await runCodemods(blockDir, targetDir);

    console.log(
      `\n✅ Successfully applied '${blockName}' block to ${targetProjectPath}`
    );

    if (Object.keys(blockInfo.dependencies).length > 0) {
      console.log("\nNext steps:");
      console.log(`  cd ${targetProjectPath}`);
      console.log("  pnpm install  # to install new dependencies");
    }
    if (blockName === "ai") {
      console.log("\nEnvironment variables needed:");
      console.log("  OPENAI_API_KEY=your_openai_api_key");
      console.log(
        "  OPENAI_BASE_URL=https://api.openai.com/v1  # or your custom endpoint"
      );
    }
  } catch (error) {
    console.error(
      `❌ Failed to apply '${blockName}' block: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
    process.exit(1);
  }
}

main().catch(console.error);
