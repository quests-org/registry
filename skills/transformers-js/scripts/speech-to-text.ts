/**
 * Transcribe audio to text using Whisper
 * @note Only accepts .wav files — convert first with ffmpeg: ffmpeg -i input.mp3 -ar 16000 -ac 1 output.wav. Do NOT pass --language with the default .en model — only use it with multilingual models like onnx-community/whisper-tiny (without .en)
 */

import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { cac } from "cac";
import { pipeline } from "./lib/pipeline.ts";

const DEFAULT_MODEL = "onnx-community/whisper-tiny.en";
const SUPPORTED_EXTENSIONS = new Set([".wav"]);

function validateWavPath(filePath: string) {
  const ext = filePath.toLowerCase().replace(/^.*(\.[^.]+)$/, "$1");
  if (!SUPPORTED_EXTENSIONS.has(ext)) {
    throw new Error(
      `Unsupported audio type "${ext}". speech-to-text requires WAV format. Convert first with ffmpeg: ffmpeg -i input${ext} -ar 16000 -ac 1 output.wav`,
    );
  }
}

export async function speechToText({
  inputPath,
  model = DEFAULT_MODEL,
  language,
  timestamps = false,
}: {
  inputPath: string;
  model?: string;
  language?: string;
  timestamps?: boolean;
}) {
  validateWavPath(inputPath);
  const transcriber = await pipeline("automatic-speech-recognition", model, {
    dtype: "q8",
  });

  const audioBuffer = await readFile(inputPath);
  const float32 = convertToFloat32(audioBuffer);

  const options: Record<string, unknown> = {};
  if (language) options.language = language;
  if (timestamps) {
    options.return_timestamps = true;
    options.chunk_length_s = 30;
    options.stride_length_s = 5;
  }

  const result = await transcriber(float32, options);
  const output = Array.isArray(result) ? result[0] : result;

  return {
    text: (output.text ?? "").trim(),
    chunks: output.chunks ?? [],
  };
}

const WHISPER_SAMPLE_RATE = 16000;

function convertToFloat32(wavBuffer: Buffer): Float32Array {
  const dataView = new DataView(
    wavBuffer.buffer,
    wavBuffer.byteOffset,
    wavBuffer.byteLength,
  );

  let offset = 12;
  while (offset < wavBuffer.byteLength - 8) {
    const chunkId = String.fromCharCode(
      dataView.getUint8(offset),
      dataView.getUint8(offset + 1),
      dataView.getUint8(offset + 2),
      dataView.getUint8(offset + 3),
    );
    const chunkSize = dataView.getUint32(offset + 4, true);
    if (chunkId === "data") {
      offset += 8;
      break;
    }
    offset += 8 + chunkSize;
  }

  const sampleRate = dataView.getUint32(24, true);
  const bitsPerSample = dataView.getUint16(34, true);
  const numChannels = dataView.getUint16(22, true);
  const bytesPerSample = bitsPerSample / 8;
  const totalSamples = Math.floor(
    (wavBuffer.byteLength - offset) / bytesPerSample / numChannels,
  );

  const raw = new Float32Array(totalSamples);
  for (let i = 0; i < totalSamples; i++) {
    const pos = offset + i * bytesPerSample * numChannels;
    if (bitsPerSample === 16) {
      const sample = dataView.getInt16(pos, true);
      raw[i] = sample / 32768;
    } else if (bitsPerSample === 32) {
      raw[i] = dataView.getFloat32(pos, true);
    }
  }

  if (sampleRate === WHISPER_SAMPLE_RATE) return raw;
  return resample(raw, sampleRate, WHISPER_SAMPLE_RATE);
}

function resample(
  samples: Float32Array,
  fromRate: number,
  toRate: number,
): Float32Array {
  const ratio = fromRate / toRate;
  const outputLength = Math.floor(samples.length / ratio);
  const output = new Float32Array(outputLength);
  for (let i = 0; i < outputLength; i++) {
    const srcIdx = i * ratio;
    const lo = Math.floor(srcIdx);
    const hi = Math.min(lo + 1, samples.length - 1);
    const frac = srcIdx - lo;
    output[i] = samples[lo] * (1 - frac) + samples[hi] * frac;
  }
  return output;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const cli = cac("speech-to-text");
  cli.usage("audio.wav");
  cli.option("--model <id>", "Model ID", { default: DEFAULT_MODEL });
  cli.option(
    "--language <code>",
    "Language code for multilingual models only (e.g. en, fr) — do not use with .en models",
  );
  cli.option("--timestamps", "Include timestamp chunks");
  cli.option("--json", "Print JSON output");
  cli.help();
  const { args, options } = cli.parse();
  if (options.help) process.exit(0);

  if (!args[0]) {
    cli.outputHelp();
    process.exit(1);
  }

  const inputPath = resolve(args[0]);

  const result = await speechToText({
    inputPath,
    model: options.model,
    language: options.language,
    timestamps: options.timestamps,
  });

  if (options.json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(`Transcription for ${args[0]}:\n  ${result.text}`);
    if (result.chunks.length > 0) {
      for (const chunk of result.chunks) {
        const ts = chunk.timestamp ?? [];
        console.log(
          `  [${ts[0]?.toFixed(1) ?? "?"}s - ${ts[1]?.toFixed(1) ?? "?"}s] ${chunk.text}`,
        );
      }
    }
  }
}
