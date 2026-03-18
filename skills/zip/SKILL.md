---
name: zip
description: "Create, extract, and list zip archives. Use when working with zip files, archives, compressed files, .zip, .numbers, extracting/unzipping archives, or compressing files into a zip."
---

# Zip

Create, extract, and inspect zip archives using `adm-zip`.

## Scripts

### `create-zip.ts` Create a zip archive from files and directories

Export: `createZip({ outputPath, inputPaths })`

```bash
tsx skills/zip/scripts/create-zip.ts --output <path> <input...>
```

| Argument          | Required | Description                             |
| ----------------- | -------- | --------------------------------------- |
| `--output <path>` | Yes      | Output zip file path                    |
| `<input...>`      | Yes      | One or more files or directories to add |

### `extract-zip.ts` Extract a zip archive to a directory

Export: `extractZip({ inputPath, outputDir })`

```bash
tsx skills/zip/scripts/extract-zip.ts <zipfile> [--output <dir>]
```

| Argument         | Required | Default                     | Description          |
| ---------------- | -------- | --------------------------- | -------------------- |
| `<zipfile>`      | Yes      |                             | Path to the zip file |
| `--output <dir>` | No       | Zip filename without `.zip` | Output directory     |

### `list-zip.ts` List contents of a zip file

Export: `listZip({ inputPath })`

```bash
tsx skills/zip/scripts/list-zip.ts <zipfile>
```

| Argument    | Required | Description          |
| ----------- | -------- | -------------------- |
| `<zipfile>` | Yes      | Path to the zip file |
