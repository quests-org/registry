import { readFile, writeFile } from "node:fs/promises";
import { relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";
import { optimize } from "svgo";

export async function optimizeSvg({
  inputPath,
  outputPath,
  multipass = true,
  pretty = false,
}: {
  inputPath: string;
  outputPath?: string;
  multipass?: boolean;
  pretty?: boolean;
}) {
  const svgString = await readFile(inputPath, "utf-8");
  const resolvedOutput = outputPath ?? inputPath;

  const result = optimize(svgString, {
    path: inputPath,
    multipass,
    js2svg: {
      indent: 2,
      pretty,
    },
  });

  await writeFile(resolvedOutput, result.data, "utf-8");

  return {
    inputBytes: Buffer.byteLength(svgString, "utf-8"),
    outputBytes: Buffer.byteLength(result.data, "utf-8"),
    outputPath: resolvedOutput,
  };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      multipass: { type: "boolean", default: true },
      output: { type: "string" },
      pretty: { type: "boolean", default: false },
    },
  });

  const [filePath] = positionals;

  if (!filePath) {
    console.error(
      "Usage: tsx skills/svg/scripts/optimize-svg.ts <path> [--output <path>] [--no-multipass] [--pretty]",
    );
    process.exit(1);
  }

  const inputPath = resolve(filePath);
  const outputPath = values.output ? resolve(values.output) : undefined;

  const result = await optimizeSvg({
    inputPath,
    outputPath,
    multipass: values.multipass,
    pretty: values.pretty,
  });

  const relOutput = relative(process.cwd(), result.outputPath) || ".";
  const savings = result.inputBytes - result.outputBytes;
  const pct =
    result.inputBytes > 0
      ? ((savings / result.inputBytes) * 100).toFixed(1)
      : "0.0";
  console.log(
    `Optimized → ${relOutput} (${result.inputBytes} → ${result.outputBytes} bytes, -${pct}%)`,
  );
}
