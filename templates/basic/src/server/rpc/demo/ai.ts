import OpenAI from "openai";
import { os } from "@orpc/server";
import { z } from "zod";

import { zodResponseFormat } from "@/server/lib/openai";

if (!process.env.OPENAI_BASE_URL) {
  throw new Error("OPENAI_BASE_URL is not set");
}

if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY is not set");
}

const openai = new OpenAI({
  baseURL: process.env.OPENAI_BASE_URL,
  apiKey: process.env.OPENAI_API_KEY,
});

if (!process.env.OPENAI_DEFAULT_MODEL) {
  throw new Error("OPENAI_DEFAULT_MODEL is not set");
}

const DEFAULT_MODEL = process.env.OPENAI_DEFAULT_MODEL;

const ChatCompletionInputSchema = z.object({
  message: z.string(),
  systemPrompt: z.string().optional(),
});

const GeneratePersonInputSchema = z.object({
  prompt: z.string(),
});

const complete = os
  .input(ChatCompletionInputSchema)
  .handler(async ({ input }) => {
    const { message, systemPrompt } = input;

    const completion = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        ...(systemPrompt
          ? [{ role: "system" as const, content: systemPrompt }]
          : []),
        { role: "user" as const, content: message },
      ],
    });

    return {
      response: completion.choices[0]?.message?.content || "",
    };
  });

const DemoSchema = z.object({
  name: z.string().describe("The name of the person"),
  age: z.number().describe("The age of the person"),
  occupation: z.string().describe("The occupation of the person"),
  bio: z.string().describe("The bio of the person"),
});

const generate = os
  .input(GeneratePersonInputSchema)
  .handler(async ({ input }) => {
    const completion = await openai.chat.completions.parse({
      model: DEFAULT_MODEL,
      messages: [
        {
          role: "user",
          content: `Generate a person based on this prompt: ${input.prompt}`,
        },
      ],
      response_format: zodResponseFormat(DemoSchema, "person"),
    });

    const person = completion.choices[0]?.message?.parsed;
    if (!person) {
      throw new Error("No parsed data received from OpenAI");
    }

    return {
      person,
    };
  });

export const router = {
  complete,
  generate,
};
