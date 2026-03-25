/**
 * Generate speech from text as a WAV file
 * @note Default --steps 5 is fast but low quality — use --steps 20+ for clearer speech, especially before feeding into speech-to-text
 */

import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { cac } from "cac";
import { pipeline } from "./lib/pipeline.ts";

const DEFAULT_MODEL = "onnx-community/Supertonic-TTS-ONNX";
const DEFAULT_VOICE = "F1";
const VOICES_BASE = `https://huggingface.co/${DEFAULT_MODEL}/resolve/main/voices`;

export async function textToSpeech({
  text,
  outputPath,
  model = DEFAULT_MODEL,
  voice = DEFAULT_VOICE,
  speed = 1.0,
  steps = 5,
}: {
  text: string;
  outputPath: string;
  model?: string;
  voice?: string;
  speed?: number;
  steps?: number;
}) {
  if (!text.trim()) {
    throw new Error("Text input cannot be empty");
  }

  const tts = await pipeline("text-to-speech", model);

  const speakerUrl = `${VOICES_BASE}/${voice}.bin`;
  const result = await tts(text, {
    speaker_embeddings: speakerUrl,
    num_inference_steps: steps,
    speed,
  });

  await mkdir(dirname(outputPath), { recursive: true });

  const wavBuffer = encodeWav(result.audio, result.sampling_rate);
  await writeFile(outputPath, wavBuffer);

  return { outputPath, voice, speed, steps };
}

function encodeWav(samples: Float32Array, sampleRate: number): Buffer {
  const numChannels = 1;
  const bitsPerSample = 16;
  const bytesPerSample = bitsPerSample / 8;
  const dataSize = samples.length * bytesPerSample;
  const buffer = Buffer.alloc(44 + dataSize);

  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * numChannels * bytesPerSample, 28);
  buffer.writeUInt16LE(numChannels * bytesPerSample, 32);
  buffer.writeUInt16LE(bitsPerSample, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataSize, 40);

  for (let i = 0; i < samples.length; i++) {
    const clamped = Math.max(-1, Math.min(1, samples[i]));
    const int16 = clamped < 0 ? clamped * 32768 : clamped * 32767;
    buffer.writeInt16LE(Math.round(int16), 44 + i * 2);
  }

  return buffer;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const cli = cac("text-to-speech");
  cli.usage('--text "Hello world" --output hello.wav');
  cli.option("--text <text>", "Text to synthesize");
  cli.option("--output <path>", "Output WAV path", { default: "output.wav" });
  cli.option("--model <id>", "Model ID", { default: DEFAULT_MODEL });
  cli.option("--voice <F1|M1>", "Voice preset (F1 = female, M1 = male)", {
    default: DEFAULT_VOICE,
  });
  cli.option("--speed <n>", "Speech speed multiplier (0.8–1.2 typical)", {
    default: 1.0,
  });
  cli.option(
    "--steps <n>",
    "Inference steps — higher = better quality, 1–50 range",
    { default: 5 },
  );
  cli.help();
  const { options } = cli.parse();
  if (options.help) process.exit(0);

  if (!options.text) {
    cli.outputHelp();
    process.exit(1);
  }

  const outputPath = resolve(options.output);
  const result = await textToSpeech({
    text: options.text,
    outputPath,
    model: options.model,
    voice: options.voice,
    speed: parseFloat(options.speed),
    steps: parseInt(options.steps),
  });
  console.log(
    `Audio → ${result.outputPath} (voice: ${result.voice}, speed: ${result.speed}x)`,
  );
}
