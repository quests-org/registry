import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";
import { PDF } from "@libpdf/core";

export async function setMeta({
  inputPath,
  outputPath,
  title,
  author,
  subject,
  keywords,
  producer,
  creator,
}: {
  inputPath: string;
  outputPath: string;
  title?: string;
  author?: string;
  subject?: string;
  keywords?: string[];
  producer?: string;
  creator?: string;
}) {
  const bytes = await readFile(inputPath);
  const pdf = await PDF.load(new Uint8Array(bytes));

  if (title !== undefined) pdf.setTitle(title);
  if (author !== undefined) pdf.setAuthor(author);
  if (subject !== undefined) pdf.setSubject(subject);
  if (keywords !== undefined) pdf.setKeywords(keywords);
  if (producer !== undefined) pdf.setProducer(producer);
  if (creator !== undefined) pdf.setCreator(creator);

  pdf.setModificationDate(new Date());

  const pdfBytes = await pdf.save();
  await writeFile(outputPath, pdfBytes);

  return { outputPath };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      output: { type: "string" },
      title: { type: "string" },
      author: { type: "string" },
      subject: { type: "string" },
      keywords: { type: "string" },
      producer: { type: "string" },
      creator: { type: "string" },
    },
  });

  const [inputPath] = positionals;

  if (!inputPath || !values.output) {
    console.error(
      "Usage: tsx scripts/set-meta.ts <input> --output <path> [--title <t>] [--author <a>] [--subject <s>] [--keywords <k1,k2>] [--producer <p>] [--creator <c>]",
    );
    process.exit(1);
  }

  const keywords = values.keywords
    ? values.keywords.split(",").map((k) => k.trim())
    : undefined;

  await setMeta({
    inputPath: resolve(inputPath),
    outputPath: resolve(values.output),
    title: values.title,
    author: values.author,
    subject: values.subject,
    keywords,
    producer: values.producer,
    creator: values.creator,
  });

  console.log(`Metadata updated, saved to ${values.output}`);
}
