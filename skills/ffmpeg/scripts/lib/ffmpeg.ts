import { execFile } from "node:child_process";
import { promisify } from "node:util";
import ffmpegPath from "ffmpeg-static";

const execFileAsync = promisify(execFile);

export function getFFmpegPath(): string {
  if (!ffmpegPath) {
    throw new Error(
      "ffmpeg-static binary not found. Ensure ffmpeg-static is installed and its install script was allowed to run.",
    );
  }
  return ffmpegPath;
}

export async function runFFmpeg(
  args: string[],
  { quiet = true, signal }: { quiet?: boolean; signal?: AbortSignal } = {},
) {
  const bin = getFFmpegPath();
  const fullArgs = quiet
    ? ["-hide_banner", "-loglevel", "error", ...args]
    : args;
  return execFileAsync(bin, fullArgs, {
    maxBuffer: 50 * 1024 * 1024,
    signal,
  });
}
