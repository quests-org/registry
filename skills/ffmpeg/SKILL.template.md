---
name: ffmpeg
description: "Convert audio and video files using a bundled FFmpeg binary. Use when converting between media formats (e.g. m4a to wav, mp4 to mp3, webm to mp4), extracting audio from video, resampling audio, probing media file info (duration, codec, sample rate), or when any other skill requires a format FFmpeg can handle."
---

# FFmpeg

Convert, probe, and manipulate audio/video files with a statically bundled FFmpeg binary (`ffmpeg-static`). No system FFmpeg install required.

**Important**: Uses `execFileSync` (not shell execution) so paths with special characters — including pnpm's `.pnpm/ffmpeg-static@x.x.x/` store paths — work correctly.

## Scripts

{{GENERATED_SCRIPT_DOCS}}

## Usage with Other Skills

### Converting audio for `speech-to-text`

The `transformers-js` speech-to-text script requires `.wav` input. Convert other formats first:

```bash
tsx scripts/convert.ts recording.m4a --wav --output recording.wav
tsx skills/transformers-js/scripts/speech-to-text.ts recording.wav
```

Or programmatically:

```typescript
import { toWav } from "./scripts/convert.ts";
import { speechToText } from "./skills/transformers-js/scripts/speech-to-text.ts";

const { outputPath } = toWav({
  inputPath: "recording.m4a",
  outputPath: "recording.wav",
});
const { text } = await speechToText({ inputPath: outputPath });
```

### Extracting audio from video

```bash
tsx scripts/convert.ts video.mp4 --output audio.mp3 --codec libmp3lame --bitrate 192k
```

### Trimming a clip

```typescript
import { convert } from "./scripts/convert.ts";

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
