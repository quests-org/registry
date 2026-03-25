---
name: zip
description: "Create, extract, and list zip archives. Use when working with zip files, archives, compressed files, .zip, .numbers, extracting/unzipping archives, or compressing files into a zip."
---

# Zip

Create, extract, and inspect zip archives using `adm-zip`.

## Scripts

### `create-zip.ts` Create a ZIP archive from files or directories

Exports:

- `createZip({ outputPath, inputPaths, }: { outputPath: string; inputPaths: readonly string[]; }): { outputPath: string; entryCount: number; }`

```text
create-zip

Usage:
  $ create-zip --output <path> <input...>

Options:
  --output <path>  Output ZIP file path
  -h, --help       Display this message
```

### `extract-zip.ts` Extract all files from a ZIP archive

Exports:

- `extractZip({ inputPath, outputDir, }: { inputPath: string; outputDir?: string; }): { outputDir: string; files: string[]; }`

```text
extract-zip

Usage:
  $ extract-zip <zipfile> [--output <dir>]

Options:
  --output <dir>  Output directory for extracted files
  -h, --help      Display this message
```

> [!NOTE]
> If --output is not specified, files are extracted into a directory named after the zip file (without the .zip extension) in the same location as the archive.

### `list-zip.ts` List entries in a ZIP archive with sizes

Exports:

- `listZip({ inputPath }: { inputPath: string; }): ZipEntryInfo[]`

```text
list-zip

Usage:
  $ list-zip <zipfile>

Options:
  -h, --help  Display this message
```
