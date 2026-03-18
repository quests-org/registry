---
name: ffmpeg
description: "Convert audio and video files using a bundled FFmpeg binary. Use when converting between media formats (e.g. m4a to wav, mp4 to mp3, webm to mp4), extracting audio from video, resampling audio, probing media file info (duration, codec, sample rate), or when any other skill requires a format FFmpeg can handle."
---

# FFmpeg

Convert, probe, and manipulate audio/video files with a statically bundled FFmpeg binary (`ffmpeg-static`). No system FFmpeg install required.

**Important**: Uses `execFileSync` (not shell execution) so paths with special characters — including pnpm's `.pnpm/ffmpeg-static@x.x.x/` store paths — work correctly.

## Scripts

### `convert.ts` Convert audio/video between formats

Export: `convert({ inputPath, outputPath, sampleRate?, channels?, codec?, bitrate?, overwrite?, extraArgs? })`
Export: `toWav({ inputPath, outputPath?, sampleRate?, channels? })`

```bash
tsx skills/ffmpeg/scripts/convert.ts <input> --output <path> [--sample-rate <n>] [--channels <n>] [--codec <name>] [--bitrate <rate>]
tsx skills/ffmpeg/scripts/convert.ts <input> --wav [--output <path>] [--sample-rate <n>] [--channels <n>]
```

| Argument            | Required | Default     | Description                                              |
| ------------------- | -------- | ----------- | -------------------------------------------------------- |
| `<input>`           | Yes      |             | Input media file                                         |
| `--output <path>`   | Yes\*    |             | Output file path (\*not required with `--wav`)           |
| `--wav`             | No       |             | Shortcut: convert to 16kHz mono WAV (for speech-to-text) |
| `--sample-rate <n>` | No       | `16000`\*\* | Audio sample rate in Hz (\*\*only with `--wav`)          |
| `--channels <n>`    | No       | `1`\*\*     | Number of audio channels (\*\*only with `--wav`)         |
| `--codec <name>`    | No       |             | Audio/video codec (e.g. `pcm_s16le`, `libmp3lame`)       |
| `--bitrate <rate>`  | No       |             | Audio bitrate (e.g. `128k`, `192k`)                      |

The `--wav` flag is a convenient shortcut for preparing audio for speech-to-text models (Whisper, etc.) — it produces 16kHz mono PCM WAV by default.

Without `--wav`, the output format is inferred from the `--output` file extension.

The `convert()` function also accepts `extraArgs` for passing arbitrary FFmpeg flags (e.g. `["-ss", "10", "-t", "30"]` to extract a 30-second clip starting at 10s).

### `probe.ts` Get media file info

Export: `probe({ inputPath })`

```bash
tsx skills/ffmpeg/scripts/probe.ts <file> [--json]
```

| Argument | Required | Default | Description      |
| -------- | -------- | ------- | ---------------- |
| `<file>` | Yes      |         | Input media file |
| `--json` | No       |         | Output as JSON   |

Returns `{ format, duration, bitrate, streams }` where each stream has `codec`, `codecType` (`audio`/`video`), and type-specific fields (`sampleRate`, `channels`, `width`, `height`).

## Usage with Other Skills

### Converting audio for `speech-to-text`

The `transformers-js` speech-to-text script requires `.wav` input. Convert other formats first:

```bash
tsx skills/ffmpeg/scripts/convert.ts recording.m4a --wav --output recording.wav
tsx skills/transformers-js/scripts/speech-to-text.ts recording.wav
```

Or programmatically:

```typescript
import { toWav } from "./skills/ffmpeg/scripts/convert.ts";
import { speechToText } from "./skills/transformers-js/scripts/speech-to-text.ts";

const { outputPath } = toWav({
  inputPath: "recording.m4a",
  outputPath: "recording.wav",
});
const { text } = await speechToText({ inputPath: outputPath });
```

### Extracting audio from video

```bash
tsx skills/ffmpeg/scripts/convert.ts video.mp4 --output audio.mp3 --codec libmp3lame --bitrate 192k
```

### Trimming a clip

```typescript
import { convert } from "./skills/ffmpeg/scripts/convert.ts";

convert({
  inputPath: "long-video.mp4",
  outputPath: "clip.mp4",
  extraArgs: ["-ss", "00:01:30", "-t", "60"],
});
```

## Notes

- The FFmpeg binary is bundled via `ffmpeg-static` — no system install needed
- The binary path is resolved programmatically and invoked with `execFileSync` to avoid shell-escaping issues with pnpm store paths
- `convert()` passes `-y` by default (overwrite output). Set `overwrite: false` to disable
- For advanced FFmpeg operations beyond these scripts, use `runFFmpeg(args)` from `scripts/lib/ffmpeg.ts` directly
