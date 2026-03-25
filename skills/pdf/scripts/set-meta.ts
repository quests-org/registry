import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { PDF } from "@libpdf/core";
import { cac } from "cac";

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
  const cli = cac("set-meta");

  cli
    .command("<inputPath>")
    .option("--output <path>", "Output PDF file path")
    .option("--title <value>", "Document title")
    .option("--author <value>", "Document author")
    .option("--subject <value>", "Document subject")
    .option("--keywords <value>", "Comma-separated document keywords")
    .option("--producer <value>", "PDF producer metadata value")
    .option("--creator <value>", "PDF creator metadata value")
    .action(async (inputPath: string, options) => {
      if (!options.output) {
        throw new Error("--output is required");
      }
      const keywords = options.keywords
        ? options.keywords.split(",").map((k: string) => k.trim())
        : undefined;
      await setMeta({
        inputPath: resolve(inputPath),
        outputPath: resolve(options.output),
        title: options.title,
        author: options.author,
        subject: options.subject,
        keywords,
        producer: options.producer,
        creator: options.creator,
      });
      console.log(`Metadata updated, saved to ${options.output}`);
    });

  cli.help();
  await cli.parse();
}
