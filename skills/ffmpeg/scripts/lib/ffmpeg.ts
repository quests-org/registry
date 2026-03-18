import { execFileSync } from "node:child_process";
import ffmpegPath from "ffmpeg-static";

export function getFFmpegPath(): string {
  if (!ffmpegPath) {
    throw new Error(
      "ffmpeg-static binary not found. Ensure ffmpeg-static is installed and its install script was allowed to run.",
    );
  }
  return ffmpegPath;
}

export function runFFmpeg(
  args: string[],
  { quiet = true }: { quiet?: boolean } = {},
) {
  const bin = getFFmpegPath();
  const fullArgs = quiet
    ? ["-hide_banner", "-loglevel", "error", ...args]
    : args;
  return execFileSync(bin, fullArgs, {
    maxBuffer: 50 * 1024 * 1024,
    stdio: ["pipe", "pipe", "pipe"],
  });
}
