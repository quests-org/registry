import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { convert, toWav } from "../scripts/convert.ts";
import { probe } from "../scripts/probe.ts";

function makeTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "ffmpeg-test-"));
}

function createTestWav(
  filePath: string,
  durationSeconds = 0.5,
  sampleRate = 44100,
) {
  const numSamples = Math.floor(sampleRate * durationSeconds);
  const dataSize = numSamples * 2;
  const buffer = Buffer.alloc(44 + dataSize);

  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataSize, 40);

  for (let i = 0; i < numSamples; i++) {
    const sample = Math.floor(
      Math.sin((2 * Math.PI * 440 * i) / sampleRate) * 16000,
    );
    buffer.writeInt16LE(sample, 44 + i * 2);
  }

  fs.writeFileSync(filePath, buffer);
}

describe("probe", () => {
  const tempDirs: string[] = [];

  afterEach(() => {
    for (const dir of tempDirs) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
    tempDirs.length = 0;
  });

  it("probes a WAV file", () => {
    const dir = makeTempDir();
    tempDirs.push(dir);

    const wavPath = path.join(dir, "test.wav");
    createTestWav(wavPath);

    const result = probe({ inputPath: wavPath });
    expect(result.format).toMatchInlineSnapshot(`"wav"`);
    expect(result.duration).toBeGreaterThan(0);
    expect(result.streams.length).toBeGreaterThanOrEqual(1);
    expect(result.streams[0].codecType).toBe("audio");
  });

  it("throws for missing file", () => {
    expect(() => probe({ inputPath: "/nonexistent/file.wav" })).toThrow(
      "File not found",
    );
  });
});

describe("convert", () => {
  const tempDirs: string[] = [];

  afterEach(() => {
    for (const dir of tempDirs) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
    tempDirs.length = 0;
  });

  it("converts WAV to a different sample rate", () => {
    const dir = makeTempDir();
    tempDirs.push(dir);

    const inputPath = path.join(dir, "input.wav");
    createTestWav(inputPath, 0.5, 44100);

    const outputPath = path.join(dir, "output.wav");
    const result = convert({
      inputPath,
      outputPath,
      sampleRate: 16000,
      channels: 1,
      codec: "pcm_s16le",
    });

    expect(result.outputPath).toBe(outputPath);
    expect(fs.existsSync(outputPath)).toBe(true);

    const info = probe({ inputPath: outputPath });
    const audio = info.streams.find((s) => s.codecType === "audio");
    expect(audio?.sampleRate).toBe(16000);
  });

  it("throws for missing input", () => {
    expect(() =>
      convert({
        inputPath: "/nonexistent/file.wav",
        outputPath: "/tmp/out.wav",
      }),
    ).toThrow("Input file not found");
  });
});

describe("toWav", () => {
  const tempDirs: string[] = [];

  afterEach(() => {
    for (const dir of tempDirs) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
    tempDirs.length = 0;
  });

  it("converts to 16kHz mono WAV by default", () => {
    const dir = makeTempDir();
    tempDirs.push(dir);

    const inputPath = path.join(dir, "input.wav");
    createTestWav(inputPath, 0.5, 44100);

    const outputPath = path.join(dir, "output.wav");
    const result = toWav({ inputPath, outputPath });

    expect(fs.existsSync(result.outputPath)).toBe(true);

    const info = probe({ inputPath: result.outputPath });
    const audio = info.streams.find((s) => s.codecType === "audio");
    expect(audio?.sampleRate).toBe(16000);
    expect(audio?.channels).toBe(1);
  });

  it("generates output path from input name when not specified", () => {
    const dir = makeTempDir();
    tempDirs.push(dir);

    const inputPath = path.join(dir, "recording.wav");
    createTestWav(inputPath);

    const result = toWav({
      inputPath,
      outputPath: path.join(dir, "recording-out.wav"),
    });
    expect(path.basename(result.outputPath)).toBe("recording-out.wav");
  });
});
