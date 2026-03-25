---
name: transformers-js
description: "Use when the user wants to remove an image background, detect objects, classify or describe an image, generate a depth map, segment an image, upscale an image, convert text to speech (TTS), transcribe audio to text (STT), classify text, find similar text, or extract names and entities. Runs locally with no API keys. Also use when testing or comparing AI models by ID."
---

# Transformers.js

Run local AI models on images, audio, and text via `@huggingface/transformers` (ONNX Runtime). Models download on first use and are cached locally. No API keys needed.

## Scripts

### `classify-image.ts` Classify an image against ImageNet categories or custom zero-shot labels

Exports:

- `classifyImage({ inputPath, model, topK, }: { inputPath: string; model?: string; topK?: number; }): Promise<{ results: { label: string; score: number; }[]; }>`
- `classifyImageZeroShot({ inputPath, labels, model, }: { inputPath: string; labels: string[]; model?: string; }): Promise<{ results: { label: string; score: number; }[]; }>`

```text
classify-image

Usage:
  $ classify-image photo.jpg

Options:
  --labels <a,b,c>  Comma-separated zero-shot labels
  --model <id>      Model ID
  --top-k <n>       Number of top labels to return (default: 5)
  --json            Print JSON output
  -h, --help        Display this message
```

> [!NOTE]
> Without --labels uses standard ImageNet (1000 fixed categories). With --labels uses CLIP zero-shot — prefer this when the image may not fit ImageNet classes or when checking for specific concepts

### `classify-text.ts` Classify or categorize text using sentiment analysis or zero-shot labels

Exports:

- `classifyText({ text, model, topK, }: { text: string; model?: string; topK?: number; }): Promise<{ results: { label: string; score: number; }[]; }>`
- `classifyTextZeroShot({ text, labels, model, multiLabel, }: { text: string; labels: string[]; model?: string; multiLabel?: boolean; }): Promise<{ results: { label: string; score: number; }[]; }>`

```text
classify-text

Usage:
  $ classify-text --text "This movie was great"

Options:
  --text <text>     Text to classify
  --labels <a,b,c>  Comma-separated zero-shot labels
  --model <id>      Model ID
  --multi-label     Enable multi-label zero-shot mode
  --top-k <n>       Number of top labels to return (default: 5)
  --json            Print JSON output
  -h, --help        Display this message
```

> [!NOTE]
> Without --labels runs sentiment analysis (POSITIVE/NEGATIVE). With --labels runs zero-shot classification — use to triage, tag, or route text (e.g. --labels "urgent,routine,spam")

### `describe-image.ts` Generate a natural-language caption for an image

Exports:

- `describeImage({ inputPath, model, maxTokens, }: { inputPath: string; model?: string; maxTokens?: number; }): Promise<{ text: string; }>`

```text
describe-image

Usage:
  $ describe-image photo.jpg

Options:
  --model <id>      Model ID (default: Xenova/vit-gpt2-image-captioning)
  --max-tokens <n>  Maximum generated tokens (default: 50)
  --json            Print JSON output
  -h, --help        Display this message
```

### `detect-objects.ts` Detect objects in an image with bounding boxes

Exports:

- `detectAndAnnotate({ inputPath, outputPath, model, threshold, }: { inputPath: string; outputPath: string; model?: string; threshold?: number; }): Promise<{ detections: { label: string; score: number; box: { xmin: number; ymin: number; xmax: number; ymax: number; }; }[]; outputPath: string; width: number; height: number; }>`
- `detectObjects({ inputPath, model, threshold, }: { inputPath: string; model?: string; threshold?: number; }): Promise<{ detections: { label: string; score: number; box: { xmin: number; ymin: number; xmax: number; ymax: number; }; }[]; }>`

```text
detect-objects

Usage:
  $ detect-objects photo.jpg --output annotated.jpg

Options:
  --output <path>    Output annotated image path
  --model <id>       Model ID (default: onnx-community/rtdetr_r50vd)
  --threshold <0-1>  Detection threshold (default: 0.5)
  --json             Print JSON output
  -h, --help         Display this message
```

> [!NOTE]
> Without --output prints detections only. With --output draws labeled bounding boxes on the image

### `embed-text.ts` Generate text embeddings and compute semantic similarity

Exports:

- `computeSimilarity({ textA, textB, model, }: { textA: string; textB: string; model?: string; }): Promise<{ similarity: number; }>`
- `embedText({ texts, model, }: { texts: string[]; model?: string; }): Promise<{ embeddings: number[][]; dimensions: number; }>`
- `rankBySimilarity({ query, candidates, model, }: { query: string; candidates: string[]; model?: string; }): Promise<{ ranked: { text: string; score: number; }[]; }>`

```text
embed-text

Usage:
  $ embed-text --text "hello world" --compare "hi there"

Options:
  --text <text>         Text to embed
  --model <id>          Model ID (default: Xenova/all-MiniLM-L6-v2)
  --compare <text>      Second text for similarity
  --candidates <a|b|c>  Pipe-separated candidate texts
  --file <path>         Text file with one entry per line
  --json                Print JSON output
  -h, --help            Display this message
```

### `estimate-depth.ts` Generate a depth map image from a photo

Exports:

- `estimateDepth({ inputPath, outputPath, model, colorize, }: { inputPath: string; outputPath: string; model?: string; colorize?: boolean; }): Promise<{ outputPath: string; width: number; height: number; }>`

```text
estimate-depth

Usage:
  $ estimate-depth photo.jpg --output depth.png

Options:
  --output <path>  Output depth map image path
  --model <id>     Model ID (default: onnx-community/depth-anything-v2-small)
  --grayscale      Disable colorized depth rendering
  -h, --help       Display this message
```

### `extract-entities.ts` Extract named entities (people, organizations, locations) from text

Exports:

- `extractEntities({ text, model, }: { text: string; model?: string; }): Promise<{ entities: { type: string; text: string; score: number; start: number; end: number; }[]; }>`
- `extractEntitiesByType({ text, model, }: { text: string; model?: string; }): Promise<{ grouped: Record<string, string[]>; entities: { type: string; text: string; score: number; start: number; end: number; }[]; }>`

```text
extract-entities

Usage:
  $ extract-entities --text "Corp was founded by Mike Bud in Chicago"

Options:
  --text <text>  Text to extract entities from
  --model <id>   Model ID (default: Xenova/bert-base-NER)
  --group        Group entities by type
  --json         Print JSON output
  -h, --help     Display this message
```

### `remove-background.ts` Remove the background from an image, producing a transparent PNG

Exports:

- `removeBackground({ inputPath, outputPath, model, }: { inputPath: string; outputPath: string; model?: string; }): Promise<{ outputPath: string; width: number; height: number; }>`

```text
remove-background

Usage:
  $ remove-background photo.jpg --output photo-no-bg.png

Options:
  --output <path>  Output image path
  --model <id>     Model ID (default: briaai/RMBG-1.4)
  -h, --help       Display this message
```

### `segment-image.ts` Segment an image into labeled regions with colored overlays

Exports:

- `segmentAndVisualize({ inputPath, outputPath, model, }: { inputPath: string; outputPath: string; model?: string; }): Promise<{ segments: Segment[]; outputPath: string; width: number; height: number; }>`
- `segmentImage({ inputPath, model, }: { inputPath: string; model?: string; }): Promise<{ segments: Segment[]; masks: { label: string; mask: RawImage; }[]; }>`

```text
segment-image

Usage:
  $ segment-image photo.jpg --output segmented.png

Options:
  --output <path>  Output segmented overlay image path
  --model <id>     Model ID (default: Xenova/detr-resnet-50-panoptic)
  --json           Print JSON output
  -h, --help       Display this message
```

> [!NOTE]
> Default model uses panoptic segmentation (distinct object instances). For scene-level regions (wall, floor, sky) use --model Xenova/segformer-b0-finetuned-ade-512-512

### `speech-to-text.ts` Transcribe audio to text using Whisper

Exports:

- `speechToText({ inputPath, model, language, timestamps, }: { inputPath: string; model?: string; language?: string; timestamps?: boolean; }): Promise<{ text: string; chunks: Chunk[]; }>`

```text
speech-to-text

Usage:
  $ speech-to-text audio.wav

Options:
  --model <id>       Model ID (default: onnx-community/whisper-tiny.en)
  --language <code>  Language code for multilingual models only (e.g. en, fr) — do not use with .en models
  --timestamps       Include timestamp chunks
  --json             Print JSON output
  -h, --help         Display this message
```

> [!NOTE]
> Only accepts .wav files — convert first with ffmpeg: ffmpeg -i input.mp3 -ar 16000 -ac 1 output.wav. Do NOT pass --language with the default .en model — only use it with multilingual models like onnx-community/whisper-tiny (without .en)

### `text-to-speech.ts` Generate speech from text as a WAV file

Exports:

- `textToSpeech({ text, outputPath, model, voice, speed, steps, }: { text: string; outputPath: string; model?: string; voice?: string; speed?: number; steps?: number; }): Promise<{ outputPath: string; voice: string; speed: number; steps: number; }>`

```text
text-to-speech

Usage:
  $ text-to-speech --text "Hello world" --output hello.wav

Options:
  --text <text>    Text to synthesize
  --output <path>  Output WAV path (default: output.wav)
  --model <id>     Model ID (default: onnx-community/Supertonic-TTS-ONNX)
  --voice <F1|M1>  Voice preset (F1 = female, M1 = male) (default: F1)
  --speed <n>      Speech speed multiplier (0.8–1.2 typical) (default: 1)
  --steps <n>      Inference steps — higher = better quality, 1–50 range (default: 5)
  -h, --help       Display this message
```

> [!NOTE]
> Default --steps 5 is fast but low quality — use --steps 20+ for clearer speech, especially before feeding into speech-to-text

### `upscale-image.ts` Upscale an image 2x using super-resolution

Exports:

- `upscaleImage({ inputPath, outputPath, model, }: { inputPath: string; outputPath: string; model?: string; }): Promise<{ outputPath: string; width: number; height: number; }>`

```text
upscale-image

Usage:
  $ upscale-image photo.jpg --output photo-upscaled.jpg

Options:
  --output <path>  Output upscaled image path
  --model <id>     Model ID (default: Xenova/swin2SR-classical-sr-x2-64)
  -h, --help       Display this message
```

## Notes

- Models are downloaded on first run and cached in `~/.cache/huggingface/`
- All models run locally via ONNX Runtime (CPU) — no API keys needed
- Use `--model` to swap in any compatible HuggingFace model tagged with `transformers.js`
- Supported image formats: `.jpg`, `.jpeg`, `.png`, `.webp`, `.bmp`, `.gif`
- `speech-to-text` only accepts `.wav` files — convert other formats first: `ffmpeg -i input.mp3 -ar 16000 -ac 1 output.wav`
- `segment-image` and `describe-image` load larger models and may need longer timeouts (120s+) or fail in memory-constrained environments
