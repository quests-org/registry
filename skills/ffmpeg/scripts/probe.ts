import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";
import { getFFmpegPath } from "./lib/ffmpeg.ts";

interface StreamInfo {
  codec: string;
  codecType: string;
  duration?: number;
  bitrate?: number;
  sampleRate?: number;
  channels?: number;
  width?: number;
  height?: number;
}

interface ProbeResult {
  format: string;
  duration?: number;
  bitrate?: number;
  streams: StreamInfo[];
}

export function probe({ inputPath }: { inputPath: string }): ProbeResult {
  if (!existsSync(inputPath)) {
    throw new Error(`File not found: ${inputPath}`);
  }

  const bin = getFFmpegPath();
  let stderr: string;
  try {
    execFileSync(bin, ["-i", inputPath, "-hide_banner"], {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    });
    stderr = "";
  } catch (err: unknown) {
    const e = err as { stderr?: string };
    stderr = e.stderr ?? "";
  }

  const streams: StreamInfo[] = [];

  const durationMatch = stderr.match(/Duration:\s*(\d+):(\d+):(\d+)\.(\d+)/);
  let duration: number | undefined;
  if (durationMatch) {
    duration =
      Number(durationMatch[1]) * 3600 +
      Number(durationMatch[2]) * 60 +
      Number(durationMatch[3]) +
      Number(durationMatch[4]) / 100;
  }

  const bitrateMatch = stderr.match(/bitrate:\s*(\d+)\s*kb\/s/);
  const bitrate = bitrateMatch ? Number(bitrateMatch[1]) : undefined;

  const formatMatch = stderr.match(/Input #0,\s*(\S+),/);
  const format = formatMatch ? formatMatch[1] : "unknown";

  const streamRegex = /Stream #\d+:\d+.*?:\s*(Audio|Video):\s*(\S+)/g;
  let match: RegExpExecArray | null;
  while ((match = streamRegex.exec(stderr)) !== null) {
    const codecType = match[1].toLowerCase();
    const codec = match[2].replace(/,$/g, "");
    const streamLine = stderr.slice(
      match.index,
      stderr.indexOf("\n", match.index),
    );

    const info: StreamInfo = { codec, codecType };

    if (codecType === "audio") {
      const srMatch = streamLine.match(/(\d+)\s*Hz/);
      if (srMatch) info.sampleRate = Number(srMatch[1]);
      const chMatch = streamLine.match(/mono|stereo|(\d+)\s*channels/);
      if (chMatch) {
        if (chMatch[0] === "mono") info.channels = 1;
        else if (chMatch[0] === "stereo") info.channels = 2;
        else info.channels = Number(chMatch[1]);
      }
    }

    if (codecType === "video") {
      const dimMatch = streamLine.match(/(\d{2,5})x(\d{2,5})/);
      if (dimMatch) {
        info.width = Number(dimMatch[1]);
        info.height = Number(dimMatch[2]);
      }
    }

    streams.push(info);
  }

  return { format, duration, bitrate, streams };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      json: { type: "boolean" },
    },
  });

  const [filePath] = positionals;
  if (!filePath) {
    console.error("Usage: tsx scripts/probe.ts <file> [--json]");
    process.exit(1);
  }

  const inputPath = resolve(filePath);
  const result = probe({ inputPath });
  const relInput = filePath;

  if (values.json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(`${relInput}:`);
    console.log(`  Format: ${result.format}`);
    if (result.duration !== undefined)
      console.log(`  Duration: ${result.duration.toFixed(2)}s`);
    if (result.bitrate !== undefined)
      console.log(`  Bitrate: ${result.bitrate} kb/s`);
    for (const stream of result.streams) {
      if (stream.codecType === "audio") {
        const parts = [`  Audio: ${stream.codec}`];
        if (stream.sampleRate) parts.push(`${stream.sampleRate} Hz`);
        if (stream.channels) parts.push(`${stream.channels}ch`);
        console.log(parts.join(", "));
      } else if (stream.codecType === "video") {
        const parts = [`  Video: ${stream.codec}`];
        if (stream.width && stream.height)
          parts.push(`${stream.width}x${stream.height}`);
        console.log(parts.join(", "));
      }
    }
  }
}
