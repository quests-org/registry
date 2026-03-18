import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";
import { PDF } from "@libpdf/core";

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
    return { filled: [], skipped: Object.keys(fields), outputPath };
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
    form.flatten();
  }

  const pdfBytes = await pdf.save();
  await writeFile(outputPath, pdfBytes);

  return { filled, skipped, outputPath };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      "fields-file": { type: "string" },
      field: { type: "string", multiple: true },
      flatten: { type: "boolean", default: false },
      list: { type: "boolean", default: false },
      output: { type: "string" },
    },
  });

  const [inputPath] = positionals;

  if (!inputPath) {
    console.error(
      "Usage: tsx scripts/fill-form.ts <input> --output <path> --fields-file <json> [--flatten] [--list]",
    );
    process.exit(1);
  }

  if (values.list) {
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

  if (!values.output) {
    console.error("--output is required");
    process.exit(1);
  }

  let fields: Record<string, string | boolean> = {};

  if (values["fields-file"]) {
    const raw = await readFile(resolve(values["fields-file"]), "utf-8");
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      console.error(
        "--fields-file must contain a JSON object of key/value pairs",
      );
      process.exit(1);
    }
    for (const [key, val] of Object.entries(
      parsed as Record<string, unknown>,
    )) {
      if (typeof val === "boolean") {
        fields[key] = val;
      } else {
        fields[key] = String(val);
      }
    }
  }

  if (values.field?.length) {
    for (const entry of values.field) {
      const eq = entry.indexOf("=");
      if (eq === -1) {
        console.error(`Invalid --field format (expected key=value): ${entry}`);
        process.exit(1);
      }
      const key = entry.slice(0, eq);
      const raw = entry.slice(eq + 1);
      fields[key] = raw === "true" ? true : raw === "false" ? false : raw;
    }
  }

  if (Object.keys(fields).length === 0) {
    console.error(
      "Provide fields via --fields-file <json> or --field key=value",
    );
    process.exit(1);
  }

  const result = await fillForm({
    inputPath: resolve(inputPath),
    outputPath: resolve(values.output),
    fields,
    flatten: values.flatten,
  });

  console.log(
    `Filled ${result.filled.length} field(s), saved to ${result.outputPath}`,
  );
  if (result.skipped.length > 0) {
    console.log(`Skipped (not found): ${result.skipped.join(", ")}`);
  }
}
