---
name: transformers-js
description: "Run local AI models via Hugging Face Transformers.js (ONNX Runtime). Use when detecting objects, classifying images or text, generating depth maps, segmenting regions, describing/captioning images, transcribing speech to text, generating speech from text, computing text embeddings/similarity, extracting named entities (people, orgs, locations) from text, or upscaling images. Activate when the user wants on-device AI inference for vision, audio, or NLP tasks — not for pixel-level image editing (use images skill)."
---

# Transformers.js

Run local AI models on images, audio, and text via `@huggingface/transformers` (ONNX Runtime). Models download on first use and are cached locally. No API keys needed.

## Scripts

### `detect-objects.ts` Detect objects with bounding boxes

Export: `detectObjects({ inputPath, model?, threshold? })`
Export: `detectAndAnnotate({ inputPath, outputPath, model?, threshold? })`

```bash
tsx skills/transformers-js/scripts/detect-objects.ts <image> [--output <path>] [--model <id>] [--threshold <0-1>] [--json]
```

| Argument          | Required | Default                       | Description                                    |
| ----------------- | -------- | ----------------------------- | ---------------------------------------------- |
| `<image>`         | Yes      |                               | Input image file                               |
| `--output <path>` | No       |                               | Save annotated image with drawn bounding boxes |
| `--model <id>`    | No       | `onnx-community/rtdetr_r50vd` | HuggingFace model ID                           |
| `--threshold <n>` | No       | `0.5`                         | Minimum confidence score                       |
| `--json`          | No       |                               | Output detections as JSON                      |

Without `--output`, prints detections only. With `--output`, draws labeled bounding boxes on the image.

Returns `{ detections: [{ label, score, box: { xmin, ymin, xmax, ymax } }] }`.

### `classify-image.ts` Classify an image

Export: `classifyImage({ inputPath, model?, topK? })`
Export: `classifyImageZeroShot({ inputPath, labels, model? })`

```bash
tsx skills/transformers-js/scripts/classify-image.ts <image> [--labels <a,b,c>] [--model <id>] [--top-k <n>] [--json]
```

| Argument           | Required | Default                                                                               | Description                                                           |
| ------------------ | -------- | ------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| `<image>`          | Yes      |                                                                                       | Input image file                                                      |
| `--labels <a,b,c>` | No       |                                                                                       | Comma-separated labels for zero-shot classification (uses CLIP model) |
| `--model <id>`     | No       | `Xenova/vit-base-patch16-224` (standard) / `Xenova/clip-vit-base-patch32` (zero-shot) | HuggingFace model ID                                                  |
| `--top-k <n>`      | No       | `5`                                                                                   | Number of top results (standard classification only)                  |
| `--json`           | No       |                                                                                       | Output as JSON                                                        |

Without `--labels`: standard ImageNet classification (1000 fixed categories). With `--labels`: zero-shot CLIP-based classification against your custom categories — prefer this mode when the image may not fit neatly into ImageNet classes or when you want to check for specific concepts.

### `describe-image.ts` Generate a text caption for an image

Export: `describeImage({ inputPath, model?, maxTokens? })`

```bash
tsx skills/transformers-js/scripts/describe-image.ts <image> [--model <id>] [--max-tokens <n>] [--json]
```

| Argument           | Required | Default                            | Description            |
| ------------------ | -------- | ---------------------------------- | ---------------------- |
| `<image>`          | Yes      |                                    | Input image file       |
| `--model <id>`     | No       | `Xenova/vit-gpt2-image-captioning` | HuggingFace model ID   |
| `--max-tokens <n>` | No       | `50`                               | Max tokens to generate |
| `--json`           | No       |                                    | Output as JSON         |

Returns `{ text }` with a natural-language description of the image contents.

### `estimate-depth.ts` Generate a depth map

Export: `estimateDepth({ inputPath, outputPath, model?, colorize? })`

```bash
tsx skills/transformers-js/scripts/estimate-depth.ts <image> --output <path> [--model <id>] [--grayscale]
```

| Argument          | Required | Default                                  | Description                           |
| ----------------- | -------- | ---------------------------------------- | ------------------------------------- |
| `<image>`         | Yes      |                                          | Input image file                      |
| `--output <path>` | No       | `<name>-depth.png`                       | Output depth map path                 |
| `--model <id>`    | No       | `onnx-community/depth-anything-v2-small` | HuggingFace model ID                  |
| `--grayscale`     | No       |                                          | Output grayscale instead of colorized |

Produces a colorized (turbo colormap) depth map by default, or a raw grayscale depth image with `--grayscale`.

### `segment-image.ts` Image segmentation

Export: `segmentImage({ inputPath, model? })`
Export: `segmentAndVisualize({ inputPath, outputPath, model? })`

```bash
tsx skills/transformers-js/scripts/segment-image.ts <image> [--output <path>] [--model <id>] [--json]
```

| Argument          | Required | Default                          | Description                              |
| ----------------- | -------- | -------------------------------- | ---------------------------------------- |
| `<image>`         | Yes      |                                  | Input image file                         |
| `--output <path>` | No       |                                  | Save visualization with colored overlays |
| `--model <id>`    | No       | `Xenova/detr-resnet-50-panoptic` | HuggingFace model ID                     |
| `--json`          | No       |                                  | Output segments as JSON                  |

Panoptic segmentation — detects and segments individual objects (cat, person, car, etc.) as distinct instances with labels and pixel masks. For scene-level segmentation (labeling regions like wall, floor, sky), pass `--model Xenova/segformer-b0-finetuned-ade-512-512`.

### `embed-text.ts` Text embeddings and semantic similarity

Export: `embedText({ texts, model? })`
Export: `computeSimilarity({ textA, textB, model? })`
Export: `rankBySimilarity({ query, candidates, model? })`

```bash
tsx skills/transformers-js/scripts/embed-text.ts <text> [--compare <text>] [--candidates <a|b|c>] [--file <path>] [--model <id>] [--json]
```

| Argument                 | Required | Default                   | Description                                              |
| ------------------------ | -------- | ------------------------- | -------------------------------------------------------- |
| `<text>`                 | Yes      |                           | Input text (or query when using --compare/--candidates)  |
| `--compare <text>`       | No       |                           | Compute cosine similarity between two texts              |
| `--candidates <a\|b\|c>` | No       |                           | Pipe-separated candidates to rank by similarity to query |
| `--file <path>`          | No       |                           | Embed each line of a text file                           |
| `--model <id>`           | No       | `Xenova/all-MiniLM-L6-v2` | HuggingFace model ID                                     |
| `--json`                 | No       |                           | Output as JSON                                           |

Returns 384-dimensional embeddings (with the default model). Use `--compare` for pairwise similarity, `--candidates` for ranking multiple options against a query.

### `classify-text.ts` Classify or categorize text

Export: `classifyText({ text, model?, topK? })`
Export: `classifyTextZeroShot({ text, labels, model?, multiLabel? })`

```bash
tsx skills/transformers-js/scripts/classify-text.ts <text> [--labels <a,b,c>] [--model <id>] [--top-k <n>] [--multi-label] [--json]
```

| Argument           | Required | Default                                                                                                            | Description                                              |
| ------------------ | -------- | ------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------- |
| `<text>`           | Yes      |                                                                                                                    | Input text (pass as positional args)                     |
| `--labels <a,b,c>` | No       |                                                                                                                    | Comma-separated labels for zero-shot classification      |
| `--model <id>`     | No       | `Xenova/distilbert-base-uncased-finetuned-sst-2-english` (standard) / `Xenova/mobilebert-uncased-mnli` (zero-shot) | HuggingFace model ID                                     |
| `--top-k <n>`      | No       | `5`                                                                                                                | Number of top results (standard mode only)               |
| `--multi-label`    | No       |                                                                                                                    | Allow multiple labels to score independently (zero-shot) |
| `--json`           | No       |                                                                                                                    | Output as JSON                                           |

Without `--labels`: sentiment analysis (POSITIVE/NEGATIVE). With `--labels`: zero-shot classification against arbitrary categories — use this to triage, tag, or route text (e.g. `--labels "urgent,routine,spam"` or `--labels "contract,invoice,proposal"`).

### `extract-entities.ts` Extract named entities from text

Export: `extractEntities({ text, model? })`
Export: `extractEntitiesByType({ text, model? })`

```bash
tsx skills/transformers-js/scripts/extract-entities.ts <text> [--group] [--model <id>] [--json]
```

| Argument       | Required | Default                | Description                            |
| -------------- | -------- | ---------------------- | -------------------------------------- |
| `<text>`       | Yes      |                        | Input text (pass as positional args)   |
| `--group`      | No       |                        | Group entities by type (PER, ORG, LOC) |
| `--model <id>` | No       | `Xenova/bert-base-NER` | HuggingFace model ID                   |
| `--json`       | No       |                        | Output as JSON                         |

Extracts people (PER), organizations (ORG), locations (LOC), and miscellaneous entities (MISC) from text. Use `--group` for a deduplicated summary by type.

Returns `{ entities: [{ type, text, score, start, end }] }`.

### `upscale-image.ts` Upscale an image (2x super-resolution)

Export: `upscaleImage({ inputPath, outputPath, model? })`

```bash
tsx skills/transformers-js/scripts/upscale-image.ts <image> [--output <path>] [--model <id>]
```

| Argument          | Required | Default                             | Description          |
| ----------------- | -------- | ----------------------------------- | -------------------- |
| `<image>`         | Yes      |                                     | Input image file     |
| `--output <path>` | No       | `<name>-upscaled.<ext>`             | Output image path    |
| `--model <id>`    | No       | `Xenova/swin2SR-classical-sr-x2-64` | HuggingFace model ID |

Upscales an image 2x using Swin2SR super-resolution. Good for enhancing low-resolution screenshots, small logos, or scanned document images.

### `speech-to-text.ts` Transcribe audio to text

Export: `speechToText({ inputPath, model?, language?, timestamps? })`

```bash
tsx skills/transformers-js/scripts/speech-to-text.ts <audio> [--model <id>] [--language <code>] [--timestamps] [--json]
```

| Argument            | Required | Default                          | Description                                                              |
| ------------------- | -------- | -------------------------------- | ------------------------------------------------------------------------ |
| `<audio>`           | Yes      |                                  | Input audio file (`.wav` only — convert other formats first with ffmpeg) |
| `--model <id>`      | No       | `onnx-community/whisper-tiny.en` | HuggingFace model ID                                                     |
| `--language <code>` | No       |                                  | Language code (e.g. `en`, `fr`) for multilingual models                  |
| `--timestamps`      | No       |                                  | Include word-level timestamps                                            |
| `--json`            | No       |                                  | Output as JSON                                                           |

**Do not pass `--language` with the default `.en` model** — it will error. `--language` is only for multilingual models like `onnx-community/whisper-tiny` (without `.en`). For higher accuracy at the cost of speed/memory, use `onnx-community/whisper-small.en` or `onnx-community/whisper-small`.

Returns `{ text, chunks }` where chunks contain timestamped segments when `--timestamps` is used.

### `text-to-speech.ts` Generate speech from text

Export: `textToSpeech({ text, outputPath, model?, voice?, speed?, steps? })`

```bash
tsx skills/transformers-js/scripts/text-to-speech.ts <text> --output <path> [--model <id>] [--voice <F1|M1>] [--speed <n>] [--steps <n>]
```

| Argument          | Required | Default                              | Description                                     |
| ----------------- | -------- | ------------------------------------ | ----------------------------------------------- |
| `<text>`          | Yes      |                                      | Text to synthesize (pass as positional args)    |
| `--output <path>` | No       | `output.wav`                         | Output WAV file path                            |
| `--model <id>`    | No       | `onnx-community/Supertonic-TTS-ONNX` | HuggingFace model ID                            |
| `--voice <name>`  | No       | `F1`                                 | Voice preset (`F1` = female, `M1` = male)       |
| `--speed <n>`     | No       | `1.0`                                | Speech speed (0.8–1.2 typical)                  |
| `--steps <n>`     | No       | `5`                                  | Inference steps (higher = better quality, 1–50) |

Generates a `.wav` audio file from the input text. The default `--steps 5` is fast but low quality — use `--steps 20` or higher for clearer speech, especially if the output will be fed into speech-to-text.

## Notes

- Models are downloaded on first run and cached in `~/.cache/huggingface/`
- All models run locally via ONNX Runtime (CPU) — no API keys needed
- Use `--model` to swap in any compatible HuggingFace model tagged with `transformers.js`
- Supported image formats: `.jpg`, `.jpeg`, `.png`, `.webp`, `.bmp`, `.gif`
- `speech-to-text` only accepts `.wav` files — convert other formats first: `ffmpeg -i input.mp3 -ar 16000 -ac 1 output.wav`
- `segment-image` and `describe-image` load larger models and may need longer timeouts (120s+) or fail in memory-constrained environments
