/**
 * Set metadata fields (title, author, subject, keywords) on a PDF
 */
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
  cli.usage('document.pdf --title "My Doc" --output output.pdf');
  cli.option("--output <path>", "Output PDF file path");
  cli.option("--title <value>", "Document title");
  cli.option("--author <value>", "Document author");
  cli.option("--subject <value>", "Document subject");
  cli.option("--keywords <value>", "Comma-separated document keywords");
  cli.option("--producer <value>", "PDF producer metadata value");
  cli.option("--creator <value>", "PDF creator metadata value");
  cli.help();
  const { args, options } = cli.parse();
  if (options.help) process.exit(0);

  if (!args[0] || !options.output) {
    cli.outputHelp();
    process.exit(1);
  }

  const keywords = options.keywords
    ? options.keywords.split(",").map((k: string) => k.trim())
    : undefined;
  await setMeta({
    inputPath: resolve(args[0]),
    outputPath: resolve(options.output),
    title: options.title,
    author: options.author,
    subject: options.subject,
    keywords,
    producer: options.producer,
    creator: options.creator,
  });
  console.log(`Metadata updated, saved to ${options.output}`);
}
