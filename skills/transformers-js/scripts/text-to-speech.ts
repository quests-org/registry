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
  cli
    .command("<text...>")
    .option("--output <path>", "Output WAV path")
    .option("--model <id>", "Model ID")
    .option("--voice <F1|M1>", "Voice embedding ID")
    .option("--speed <n>", "Speech speed multiplier")
    .option("--steps <n>", "Inference step count")
    .action(async (textParts: string[], options) => {
      const text = textParts.join(" ");
      const outputPath = resolve(options.output ?? "output.wav");
      const result = await textToSpeech({
        text,
        outputPath,
        model: options.model ?? DEFAULT_MODEL,
        voice: options.voice ?? DEFAULT_VOICE,
        speed: options.speed ? parseFloat(options.speed) : 1.0,
        steps: options.steps ? parseInt(options.steps) : 5,
      });

      const relOutput = result.outputPath;
      console.log(
        `Audio → ${relOutput} (voice: ${result.voice}, speed: ${result.speed}x)`,
      );
    });
  cli.help();
  cli.parse();
}
