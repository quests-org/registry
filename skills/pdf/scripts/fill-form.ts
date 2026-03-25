/**
 * Fill PDF form fields by name and optionally flatten the form
 * @note One of --json (inline JSON object) or --json-file (path to JSON file) is required. Each key is a field name; values are strings or booleans (for checkboxes).
 * @note Use --list to discover available field names before filling. Field names are matched with trimmed whitespace.
 * @note Use --flatten to bake filled values into the page so the form is no longer editable.
 */
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { PDF } from "@libpdf/core";
import { cac } from "cac";

function buildTrimmedLookup(fieldNames: string[]) {
  const map = new Map<string, string>();
  for (const name of fieldNames) {
    map.set(name, name);
    const trimmed = name.trim();
    if (trimmed !== name && !map.has(trimmed)) {
      map.set(trimmed, name);
    }
  }
  return map;
}

export async function fillForm({
  inputPath,
  outputPath,
  fields,
  flatten = false,
}: {
  inputPath: string;
  outputPath: string;
  fields: Record<string, string | boolean>;
  flatten?: boolean;
}) {
  const bytes = await readFile(inputPath);
  const pdf = await PDF.load(new Uint8Array(bytes));
  const form = pdf.getForm();

  if (!form) {
    await writeFile(outputPath, await pdf.save());
    return {
      filled: [],
      skipped: Object.keys(fields),
      outputPath,
      warnings: pdf.warnings,
    };
  }

  const fieldNames = form.getFieldNames();
  const lookup = buildTrimmedLookup(fieldNames);
  const filled: string[] = [];
  const skipped: string[] = [];

  for (const [name, value] of Object.entries(fields)) {
    const actualName = lookup.get(name) ?? lookup.get(name.trim());
    if (!actualName) {
      skipped.push(name);
      continue;
    }

    try {
      const field = form.getField(actualName);
      if (!field) {
        skipped.push(name);
        continue;
      }

      if (field.type === "text") {
        form.getTextField(actualName)?.setValue(String(value));
      } else if (field.type === "checkbox") {
        const cb = form.getCheckbox(actualName);
        if (value === true || value === "true") {
          cb?.check();
        } else {
          cb?.uncheck();
        }
      } else if (field.type === "dropdown") {
        form.getDropdown(actualName)?.setValue(String(value));
      } else if (field.type === "listbox") {
        form
          .getListBox(actualName)
          ?.setValue(Array.isArray(value) ? value : [String(value)]);
      } else if (field.type === "radio") {
        form.getRadioGroup(actualName)?.setValue(String(value));
      }
      filled.push(actualName);
    } catch {
      skipped.push(name);
    }
  }

  if (flatten) {
    form.flatten({ regenerateAppearances: true });
  }

  const pdfBytes = await pdf.save();
  await writeFile(outputPath, pdfBytes);

  const warnings = pdf.warnings;

  return { filled, skipped, outputPath, warnings };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const cli = cac("fill-form");
  cli.usage(
    'form.pdf --json \'{"name":"John","agree":true}\' --output filled.pdf',
  );
  cli.option("--json <inlineJson>", "Inline JSON object of field values");
  cli.option("--json-file <path>", "Path to JSON file of field values");
  cli.option("--flatten", "Flatten filled fields into static PDF content");
  cli.option("--list", "List available form fields");
  cli.option("--output <path>", "Output PDF file path");
  cli.help();
  const { args, options } = cli.parse();
  if (options.help) process.exit(0);

  if (!args[0]) {
    cli.outputHelp();
    process.exit(1);
  }

  const inputPath = args[0];

  if (options.list) {
    const bytes = await readFile(resolve(inputPath));
    const pdf = await PDF.load(new Uint8Array(bytes));
    const form = pdf.getForm();
    if (!form || form.isEmpty) {
      console.log("No form fields found.");
    } else {
      for (const field of form.getFields()) {
        console.log(`${field.name} (${field.type})`);
      }
    }
    process.exit(0);
  }

  if (!options.output) {
    throw new Error("--output is required");
  }

  if (!options.json && !options.jsonFile) {
    cli.outputHelp();
    process.exit(1);
  }

  let fields: Record<string, string | boolean>;
  try {
    const raw = options.jsonFile
      ? await readFile(resolve(options.jsonFile), "utf-8")
      : options.json;
    if (raw === undefined) {
      throw new Error("Missing fields JSON");
    }
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error("JSON must be an object of key/value pairs");
    }
    fields = {};
    for (const [key, val] of Object.entries(parsed)) {
      fields[key] = typeof val === "boolean" ? val : String(val);
    }
  } catch {
    console.error("Failed to parse fields JSON");
    process.exit(1);
  }

  const result = await fillForm({
    inputPath: resolve(inputPath),
    outputPath: resolve(options.output),
    fields,
    flatten: Boolean(options.flatten),
  });
  console.log(
    `Filled ${result.filled.length} field(s), saved to ${result.outputPath}`,
  );
  if (result.skipped.length > 0) {
    console.log(`Skipped (not found): ${result.skipped.join(", ")}`);
  }
  if (result.warnings.length > 0) {
    const counts = new Map<string, number>();
    for (const w of result.warnings) counts.set(w, (counts.get(w) ?? 0) + 1);
    for (const [w, n] of counts)
      console.warn(`Warning: ${w}${n > 1 ? ` (x${n})` : ""}`);
  }
}
