import { createOpenAI } from "@ai-sdk/openai";
import { generateText, Output } from "ai";
import { os } from "@orpc/server";
import { z } from "zod";

const MODEL = "gpt-5.2"; // Just a placeholder, use a known good model

const complete = os
  .input(
    z.object({
      message: z.string(),
    }),
  )
  .handler(async ({ input }) => {
    const { message } = input;
    const openai = createOpenAI();

    const { text } = await generateText({
      model: openai(MODEL),
      system: "You are a helpful assistant.",
      prompt: message,
    });

    return {
      response: text,
    };
  });

// Object generation schemas only support nullability, not optionality.
// Use .nullable() instead of .optional() for fields that may not have values.
const DemoSchema = z.object({
  name: z.string().describe("The name of the person"),
  age: z.number().describe("The age of the person"),
  occupation: z.string().describe("The occupation of the person"),
  bio: z.string().describe("The bio of the person"),
  nickname: z
    .string()
    .nullable()
    .describe("The person's nickname, if they have one"),
});

const generate = os
  .input(
    z.object({
      prompt: z.string(),
    }),
  )
  .handler(async ({ input }) => {
    const openai = createOpenAI();

    const { output } = await generateText({
      model: openai(MODEL),
      output: Output.object({
        schema: DemoSchema,
      }),
      prompt: `Generate a person based on this prompt: ${input.prompt}`,
    });

    return {
      person: output,
    };
  });

export const router = {
  complete,
  generate,
};
