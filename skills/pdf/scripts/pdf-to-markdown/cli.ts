import {
  convertPdfToMarkdown,
  generateOutputPath,
  resolvePath,
} from "./convert";

function parseArgs(argv: string[]): {
  file: string | null;
  output: string | null;
  help: boolean;
} {
  const args = {
    file: null as string | null,
    output: null as string | null,
    help: false,
  };

  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--file" && argv[i + 1]) {
      args.file = argv[++i];
    } else if (arg === "--output" && argv[i + 1]) {
      args.output = argv[++i];
    } else if (arg === "--help" || arg === "-h") {
      args.help = true;
    } else if (!arg.startsWith("--") && !args.file) {
      args.file = arg;
    }
  }

  return args;
}

function printUsage() {
  console.log(`
PDF to Markdown Converter

Usage:
  tsx scripts/pdf-to-markdown/cli.ts --file <input.pdf> [options]

Options:
  --file <path>    Input PDF file (required)
  --output <path>  Output Markdown path (default: same name as input)
  --help, -h       Show this help message

Examples:
  tsx scripts/pdf-to-markdown/cli.ts --file ./document.pdf
  tsx scripts/pdf-to-markdown/cli.ts --file ./doc.pdf --output ./output/doc.md

Known Limitations:
  - Tables may not be accurately converted
  - Multi-column layouts may interleave text
  - Scanned PDFs require OCR (not supported)
  - Complex formatting may be simplified
`);
}

async function main() {
  const args = parseArgs(process.argv);
  const cwd = process.cwd();

  if (args.help) {
    printUsage();
    process.exit(0);
  }

  if (!args.file) {
    console.error("Error: --file argument is required");
    console.error("Run with --help for usage information");
    process.exit(1);
  }

  const inputPath = resolvePath(args.file, cwd);
  const outputPath = args.output
    ? resolvePath(args.output, cwd)
    : generateOutputPath(inputPath, cwd);

  const result = await convertPdfToMarkdown({ inputPath, outputPath });

  console.log(JSON.stringify(result, null, 2));
  process.exit(result.success ? 0 : 1);
}

main().catch((err) => {
  console.log(
    JSON.stringify(
      {
        success: false,
        error: err instanceof Error ? err.message : "Unknown error",
      },
      null,
      2,
    ),
  );
  process.exit(1);
});
