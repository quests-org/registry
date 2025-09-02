import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { generateText } from "ai";
import { os } from "@orpc/server";
import { z } from "zod";

// Environment variables are automatically available inside Quests
if (!process.env.OPENAI_BASE_URL) {
  throw new Error("OPENAI_BASE_URL is not set");
}

const openai = createOpenAICompatible({
  name: "openai-compatible",
  baseURL: process.env.OPENAI_BASE_URL,
  apiKey: process.env.OPENAI_API_KEY,
});

if (!process.env.OPENAI_DEFAULT_MODEL) {
  throw new Error("OPENAI_DEFAULT_MODEL is not set");
}

// OPENAI_DEFAULT_MODEL is an optional default model the user has available
const DEFAULT_MODEL = process.env.OPENAI_DEFAULT_MODEL;

const ChatCompletionInputSchema = z.object({
  message: z.string(),
  systemPrompt: z.string().optional(),
});

const GeneratePersonInputSchema = z.object({
  prompt: z.string(),
});

// Handler for chat completion using AI SDK's generateText
// Takes a message and optional system prompt, returns AI response
const complete = os
  .input(ChatCompletionInputSchema)
  .handler(async ({ input }) => {
    const { message, systemPrompt } = input;

    const result = await generateText({
      model: openai(DEFAULT_MODEL),
      system: systemPrompt || "You are a helpful assistant.",
      prompt: message,
    });

    return {
      response: result.text,
      usage: result.usage,
    };
  });

const DemoSchema = z.object({
  name: z.string().describe("The name of the person"),
  age: z.number().describe("The age of the person"),
  occupation: z.string().describe("The occupation of the person"),
  bio: z.string().describe("The bio of the person"),
});

// Handler for structured object generation using AI SDK's generateText
// Note: we cannot use generateObject reliably with the OpenAI compatible provider
// due to multi-provider support being spotty.
const generate = os
  .input(GeneratePersonInputSchema)
  .handler(async ({ input }) => {
    const systemPrompt = `You are a helpful assistant that generates JSON objects based on the given prompt. 
You must respond with valid JSON that matches this exact schema:

${JSON.stringify(z.toJSONSchema(DemoSchema), null, 2)}

Respond only with the JSON object, no additional text or formatting.`;

    const result = await generateText({
      model: openai(DEFAULT_MODEL),
      system: systemPrompt,
      prompt: input.prompt,
    });

    try {
      const parsedObject = JSON.parse(result.text);
      const validatedPerson = DemoSchema.parse(parsedObject);

      return {
        person: validatedPerson,
        usage: result.usage,
      };
    } catch (error) {
      throw new Error(
        `Failed to parse or validate JSON response: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  });

export const router = {
  complete,
  generate,
};
