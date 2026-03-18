import { existsSync } from "node:fs";
import { basename, extname, relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";
import { runFFmpeg } from "./lib/ffmpeg.ts";

export function convert({
  inputPath,
  outputPath,
  sampleRate,
  channels,
  codec,
  bitrate,
  overwrite = true,
  extraArgs = [],
}: {
  inputPath: string;
  outputPath: string;
  sampleRate?: number;
  channels?: number;
  codec?: string;
  bitrate?: string;
  overwrite?: boolean;
  extraArgs?: string[];
}) {
  if (!existsSync(inputPath)) {
    throw new Error(`Input file not found: ${inputPath}`);
  }

  const args: string[] = [];
  if (overwrite) args.push("-y");
  args.push("-i", inputPath);
  if (codec) args.push("-acodec", codec);
  if (sampleRate) args.push("-ar", String(sampleRate));
  if (channels) args.push("-ac", String(channels));
  if (bitrate) args.push("-b:a", bitrate);
  args.push(...extraArgs);
  args.push(outputPath);

  runFFmpeg(args);

  return { outputPath };
}

export function toWav({
  inputPath,
  outputPath,
  sampleRate = 16000,
  channels = 1,
}: {
  inputPath: string;
  outputPath?: string;
  sampleRate?: number;
  channels?: number;
}) {
  const resolved = resolve(inputPath);
  const name = basename(resolved, extname(resolved));
  const out = resolve(outputPath ?? `${name}.wav`);

  return convert({
    inputPath: resolved,
    outputPath: out,
    codec: "pcm_s16le",
    sampleRate,
    channels,
  });
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      output: { type: "string" },
      "sample-rate": { type: "string" },
      channels: { type: "string" },
      codec: { type: "string" },
      bitrate: { type: "string" },
      wav: { type: "boolean" },
    },
  });

  const [filePath] = positionals;
  if (!filePath) {
    console.error(
      "Usage: tsx skills/ffmpeg/scripts/convert.ts <input> --output <path> [--wav] [--sample-rate <n>] [--channels <n>] [--codec <name>] [--bitrate <rate>]",
    );
    process.exit(1);
  }

  const inputPath = resolve(filePath);

  let result: { outputPath: string };

  if (values.wav) {
    result = toWav({
      inputPath,
      outputPath: values.output ? resolve(values.output) : undefined,
      sampleRate: values["sample-rate"]
        ? Number(values["sample-rate"])
        : undefined,
      channels: values.channels ? Number(values.channels) : undefined,
    });
  } else {
    if (!values.output) {
      console.error(
        "--output is required (or use --wav for automatic WAV conversion)",
      );
      process.exit(1);
    }
    result = convert({
      inputPath,
      outputPath: resolve(values.output),
      sampleRate: values["sample-rate"]
        ? Number(values["sample-rate"])
        : undefined,
      channels: values.channels ? Number(values.channels) : undefined,
      codec: values.codec,
      bitrate: values.bitrate,
    });
  }

  const relOutput = relative(process.cwd(), result.outputPath) || ".";
  console.log(`Converted to ${relOutput}`);
}
