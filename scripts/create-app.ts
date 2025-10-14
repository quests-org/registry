import nodeIgnore from "ignore";
import { promises as fs } from "node:fs";
import * as path from "node:path";

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

async function getIgnore(
  rootDir: AbsolutePath,
  options?: { signal?: AbortSignal }
) {
  const gitIgnorePath = absolutePathJoin(rootDir, ".gitignore");
  const exists = await fileExists(gitIgnorePath);
  if (!exists) {
    return nodeIgnore();
  }
  const gitignorePath = path.join(rootDir, ".gitignore");
  const gitignoreContent = await fs.readFile(gitignorePath, {
    encoding: "utf8",
    signal: options?.signal,
  });

  return nodeIgnore().add(gitignoreContent).add(".git");
}

export function copyTemplate({
  targetDir,
  templateDir,
}: {
  targetDir: AbsolutePath;
  templateDir: AbsolutePath;
}): Promise<boolean> {
  return getIgnore(templateDir)
    .then((ignore) =>
      fs.cp(templateDir, targetDir, {
        filter: (src) => {
          const relativePath = path.relative(templateDir, src);
          return relativePath === "" || !ignore.ignores(relativePath);
        },
        recursive: true,
      })
    )
    .then(() => true)
    .catch((error) => {
      throw new Error(
        `Failed to copy template: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    });
}

async function updatePackageJson(
  appDir: AbsolutePath,
  appName: string
): Promise<void> {
  const packageJsonPath = path.join(appDir, "package.json");
  try {
    const content = await fs.readFile(packageJsonPath, "utf-8");
    const packageJson = JSON.parse(content);

    packageJson.name = `quests-app-${appName}`;

    await fs.writeFile(
      packageJsonPath,
      JSON.stringify(packageJson, null, 2) + "\n"
    );
  } catch (error) {
    console.warn(
      `Warning: Could not update package.json: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

function parseArguments() {
  const args = process.argv.slice(2);
  let appName: string | undefined;
  let templateName = "basic";

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--template") {
      const nextArg = args[i + 1];
      if (!nextArg || nextArg.startsWith("-")) {
        console.error("Error: --template requires a template name");
        process.exit(1);
      }
      templateName = nextArg;
      i++; // Skip the next argument since we've consumed it
    } else if (!arg.startsWith("-")) {
      if (appName) {
        console.error("Error: Multiple app names provided");
        process.exit(1);
      }
      appName = arg;
    } else {
      console.error(`Error: Unknown argument: ${arg}`);
      process.exit(1);
    }
  }

  return { appName, templateName };
}

async function main(): Promise<void> {
  const { appName, templateName } = parseArguments();

  if (!appName) {
    console.error(
      "Usage: tsx scripts/create-app.ts <app-name> [--template <template-name>]"
    );
    console.error(
      "Example: tsx scripts/create-app.ts my-new-app --template shadcn"
    );
    console.error("Available templates: basic, empty, shadcn");
    process.exit(1);
  }

  if (!/^[a-z0-9-]+$/.test(appName)) {
    console.error(
      "App name must contain only lowercase letters, numbers, and hyphens"
    );
    process.exit(1);
  }

  const projectRoot = process.cwd();
  const templateDir = path.join(
    projectRoot,
    "templates",
    templateName
  ) as AbsolutePath;
  const targetDir = path.join(projectRoot, "templates", appName) as AbsolutePath;

  try {
    await fs.access(templateDir);
  } catch {
    console.error(
      `Template '${templateName}' not found in templates directory`
    );
    console.error("Available templates: basic, empty, shadcn");
    process.exit(1);
  }

  try {
    await fs.access(targetDir);
    console.error(`App directory already exists: templates/${appName}`);
    process.exit(1);
  } catch {}

  console.log(`Creating new app: ${appName}`);
  console.log(`Template: ${templateName}`);
  console.log(`Target: ${targetDir}`);

  try {
    await copyTemplate({ templateDir, targetDir });
    await updatePackageJson(targetDir, appName);

    console.log(`✅ Successfully created app: templates/${appName}`);
    console.log("\nNext steps:");
    console.log(`  cd templates/${appName}`);
    console.log("  pnpm install");
    console.log("  pnpm dev");
  } catch (error) {
    console.error(
      `❌ Failed to create app: ${
        error instanceof Error ? error.message : String(error)
      }`
    );

    try {
      await fs.rm(targetDir, { recursive: true, force: true });
    } catch {}

    process.exit(1);
  }
}

main().catch(console.error);
