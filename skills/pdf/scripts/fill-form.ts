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

  cli
    .command("<inputPath>")
    .option("--fields-file <json>", "JSON file containing field values")
    .option("--field <key=value>", "Single field assignment (repeatable)", {
      type: [],
    })
    .option("--flatten", "Flatten filled fields into static PDF content")
    .option("--list", "List available form fields")
    .option("--output <path>", "Output PDF file path")
    .action(async (inputPath: string, options) => {
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
        return;
      }
      if (!options.output) {
        throw new Error("--output is required");
      }
      let fields: Record<string, string | boolean> = {};
      if (options.fieldsFile) {
        const raw = await readFile(resolve(options.fieldsFile), "utf-8");
        const parsed: unknown = JSON.parse(raw);
        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
          throw new Error(
            "--fields-file must contain a JSON object of key/value pairs",
          );
        }
        for (const [key, val] of Object.entries(parsed)) {
          fields[key] = typeof val === "boolean" ? val : String(val);
        }
      }
      if (options.field?.length) {
        for (const entry of options.field) {
          const eq = entry.indexOf("=");
          if (eq === -1) {
            throw new Error(
              `Invalid --field format (expected key=value): ${entry}`,
            );
          }
          const key = entry.slice(0, eq);
          const raw = entry.slice(eq + 1);
          fields[key] = raw === "true" ? true : raw === "false" ? false : raw;
        }
      }
      if (Object.keys(fields).length === 0) {
        throw new Error(
          "Provide fields via --fields-file <json> or --field key=value",
        );
      }
      const result = await fillForm({
        inputPath: resolve(inputPath),
        outputPath: resolve(options.output),
        fields,
        flatten: Boolean(options.flatten),
      });
      const relOutput = result.outputPath;
      console.log(
        `Filled ${result.filled.length} field(s), saved to ${relOutput}`,
      );
      if (result.skipped.length > 0) {
        console.log(`Skipped (not found): ${result.skipped.join(", ")}`);
      }
      if (result.warnings.length > 0) {
        for (const warning of result.warnings) {
          console.warn(`Warning: ${warning}`);
        }
      }
    });

  cli.help();
  await cli.parse();
}
