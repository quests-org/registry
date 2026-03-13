import fs from "node:fs";
import path from "node:path";
import { PDFParse } from "pdf-parse";

function isPathSafe(filePath: string): boolean {
  if (!filePath) return false;
  if (filePath.includes("\0")) return false;
  const normalized = path.normalize(filePath);
  if (normalized.startsWith("..")) return false;
  return true;
}

function sanitizeErrorMessage(message: string): string {
  if (!message) return "Unknown error";
  return message
    .replaceAll(/[A-Za-z]:[/\\][^\s'"<>]+/g, "[path]")
    .replaceAll(/\/[^\s'"<>]+/g, "[path]");
}

function textToMarkdown(text: string, info: Record<string, string>): string {
  const lines = text.split("\n");
  const result: string[] = [];

  if (info.Title) {
    result.push(`# ${info.Title}\n`);
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (!line) {
      if (result.length > 0 && result[result.length - 1] !== "") {
        result.push("");
      }
      continue;
    }

    if (line.length < 80 && line.length > 2) {
      if (line === line.toUpperCase() && /[A-Z]/.test(line)) {
        result.push(`\n## ${line}\n`);
        continue;
      }

      if (line.endsWith(":") && !line.includes(".")) {
        result.push(`\n### ${line.slice(0, -1)}\n`);
        continue;
      }
    }

    if (/^[\u2022\u2023\u25E6\u2043\u2219•●○◦‣⁃]\s/.test(line)) {
      result.push(`- ${line.slice(2)}`);
      continue;
    }

    if (/^\d+[.)]\s/.test(line)) {
      result.push(line);
      continue;
    }

    result.push(line);
  }

  return result.join("\n").trim();
}

type ConversionResult =
  | {
      success: true;
      input: string;
      output: string;
      wordCount: number;
      pages: number;
      warnings?: string[];
    }
  | { success: false; input: string; output: string; error: string };

export async function convertPdfToMarkdown({
  inputPath,
  outputPath,
}: {
  inputPath: string;
  outputPath: string;
}): Promise<ConversionResult> {
  if (!isPathSafe(inputPath) || !isPathSafe(outputPath)) {
    return {
      success: false,
      input: inputPath,
      output: outputPath,
      error: "Invalid path provided",
    };
  }

  if (!fs.existsSync(inputPath)) {
    return {
      success: false,
      input: inputPath,
      output: outputPath,
      error: "Input file not found",
    };
  }

  if (!inputPath.toLowerCase().endsWith(".pdf")) {
    return {
      success: false,
      input: inputPath,
      output: outputPath,
      error: "Input file must be a .pdf file",
    };
  }

  const warnings: string[] = [];

  try {
    const buffer = new Uint8Array(fs.readFileSync(inputPath));
    const parser = new PDFParse({ data: buffer });
    const textResult = await parser.getText();
    const infoResult = await parser.getInfo();
    await parser.destroy();

    const markdown = textToMarkdown(
      textResult.text,
      (infoResult.info as Record<string, string>) ?? {},
    );

    const wordCount = markdown
      .replaceAll(/[#*`[\]()_~]/g, "")
      .split(/\s+/)
      .filter((w) => w.length > 0).length;

    if (wordCount < 10 && infoResult.total > 0) {
      warnings.push("PDF may be image-based or scanned (requires OCR)");
    }

    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(outputPath, markdown, "utf8");

    return {
      success: true,
      input: inputPath,
      output: outputPath,
      wordCount,
      pages: infoResult.total,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Unknown error";

    if (
      errorMsg.includes("Invalid PDF") ||
      errorMsg.includes("password") ||
      errorMsg.includes("encrypted")
    ) {
      return {
        success: false,
        input: inputPath,
        output: outputPath,
        error: "Invalid or password-protected PDF",
      };
    }

    return {
      success: false,
      input: inputPath,
      output: outputPath,
      error: sanitizeErrorMessage(errorMsg),
    };
  }
}

export function generateOutputPath(inputPath: string, cwd: string): string {
  const parsed = path.parse(inputPath);
  const outputName = `${parsed.name}.md`;
  return path.join(parsed.dir || cwd, outputName);
}

export function resolvePath(inputPath: string, cwd: string): string {
  return path.isAbsolute(inputPath) ? inputPath : path.resolve(cwd, inputPath);
}
