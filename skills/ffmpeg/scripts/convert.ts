/**
 * Convert audio or video files using FFmpeg
 * @note Use --wav for a quick conversion to 16kHz mono WAV (required format for speech-to-text)
 */
import { existsSync } from "node:fs";
import { basename, extname, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { cac } from "cac";
import { runFFmpeg } from "./lib/ffmpeg.ts";

export async function convert({
  inputPath,
  outputPath,
  sampleRate,
  channels,
  codec,
  bitrate,
  overwrite = true,
  extraArgs = [],
  signal,
}: {
  inputPath: string;
  outputPath: string;
  sampleRate?: number;
  channels?: number;
  codec?: string;
  bitrate?: string;
  overwrite?: boolean;
  extraArgs?: string[];
  signal?: AbortSignal;
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

  await runFFmpeg(args, { signal });

  return { outputPath };
}

export async function toWav({
  inputPath,
  outputPath,
  sampleRate = 16000,
  channels = 1,
  signal,
}: {
  inputPath: string;
  outputPath?: string;
  sampleRate?: number;
  channels?: number;
  signal?: AbortSignal;
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
    signal,
  });
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const cli = cac("convert");
  cli.usage(
    "<input> --output <path> [--wav] [--sample-rate <n>] [--channels <n>] [--codec <name>] [--bitrate <rate>]",
  );
  cli.option("--output <path>", "Output media file path");
  cli.option("--sample-rate <n>", "Audio sample rate in Hz");
  cli.option("--channels <n>", "Audio channel count");
  cli.option("--codec <name>", "Audio codec name");
  cli.option("--bitrate <rate>", "Audio bitrate, e.g. 192k");
  cli.option("--wav", "Convert to WAV with sensible defaults");
  cli.help();
  const parsed = cli.parse();
  const { options } = parsed;
  if (options.help) process.exit(0);
  const [filePath] = parsed.args;
  if (!filePath) {
    cli.outputHelp();
    process.exit(1);
  }

  const inputPath = resolve(filePath);
  const ac = new AbortController();
  for (const sig of ["SIGINT", "SIGTERM"] as const) {
    process.once(sig, () => ac.abort());
  }

  let result: { outputPath: string };

  if (options.wav) {
    result = await toWav({
      inputPath,
      outputPath: options.output ? resolve(options.output) : undefined,
      sampleRate: options["sampleRate"]
        ? Number(options["sampleRate"])
        : undefined,
      channels: options.channels ? Number(options.channels) : undefined,
      signal: ac.signal,
    });
  } else {
    if (!options.output) {
      console.error(
        "--output is required (or use --wav for automatic WAV conversion)",
      );
      process.exit(1);
    }
    result = await convert({
      inputPath,
      outputPath: resolve(options.output),
      sampleRate: options["sampleRate"]
        ? Number(options["sampleRate"])
        : undefined,
      channels: options.channels ? Number(options.channels) : undefined,
      codec: options.codec,
      bitrate: options.bitrate,
      signal: ac.signal,
    });
  }

  console.log(`Converted to ${result.outputPath}`);
}
