---
name: transformers-js
description: "Use when the user wants to remove an image background, detect objects, classify or describe an image, generate a depth map, segment an image, upscale an image, convert text to speech (TTS), transcribe audio to text (STT), classify text, find similar text, or extract names and entities. Runs locally with no API keys. Also use when testing or comparing AI models by ID."
---

# Transformers.js

Run local AI models on images, audio, and text via `@huggingface/transformers` (ONNX Runtime). Models download on first use and are cached locally. No API keys needed.

## Scripts

{{GENERATED_SCRIPT_DOCS}}

## Notes

- Models are downloaded on first run and cached in `~/.cache/huggingface/`
- All models run locally via ONNX Runtime (CPU) — no API keys needed
- Use `--model` to swap in any compatible HuggingFace model tagged with `transformers.js`
- Supported image formats: `.jpg`, `.jpeg`, `.png`, `.webp`, `.bmp`, `.gif`
- `speech-to-text` only accepts `.wav` files — convert other formats first: `ffmpeg -i input.mp3 -ar 16000 -ac 1 output.wav`
- `segment-image` and `describe-image` load larger models and may need longer timeouts (120s+) or fail in memory-constrained environments
