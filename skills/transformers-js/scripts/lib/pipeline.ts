import { pipeline } from "@huggingface/transformers";

const SUPPORTED_IMAGE_EXTENSIONS = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".bmp",
  ".gif",
]);

const SUPPORTED_AUDIO_EXTENSIONS = new Set([".wav", ".flac", ".mp3", ".ogg"]);

export function validateImagePath(filePath: string) {
  const ext = filePath.toLowerCase().replace(/^.*(\.[^.]+)$/, "$1");
  if (!SUPPORTED_IMAGE_EXTENSIONS.has(ext)) {
    throw new Error(
      `Unsupported image type "${ext}". Supported: ${[...SUPPORTED_IMAGE_EXTENSIONS].join(", ")}`,
    );
  }
}

export function validateAudioPath(filePath: string) {
  const ext = filePath.toLowerCase().replace(/^.*(\.[^.]+)$/, "$1");
  if (!SUPPORTED_AUDIO_EXTENSIONS.has(ext)) {
    throw new Error(
      `Unsupported audio type "${ext}". Supported: ${[...SUPPORTED_AUDIO_EXTENSIONS].join(", ")}`,
    );
  }
}

export { pipeline };
