import type { Context } from "hono";
import { streamText } from "ai";
import type { BlankEnv } from "hono/types";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

if (!process.env.OPENAI_BASE_URL) {
  throw new Error("OPENAI_BASE_URL is not set");
}

const openai = createOpenAICompatible({
  name: "openai-compatible",
  baseURL: process.env.OPENAI_BASE_URL,
  apiKey: process.env.OPENAI_API_KEY,
});

export async function chat(c: Context<BlankEnv>) {
  const { prompt }: { prompt: string } = await c.req.json();

  try {
    const result = streamText({
      model: openai("openai/gpt-4o-mini"),
      prompt,
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("Error sending prompt", error);
    return c.json({ error: "Internal server error" }, 500);
  }
}
