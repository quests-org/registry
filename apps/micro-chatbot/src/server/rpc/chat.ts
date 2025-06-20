import { os, streamToEventIterator, type } from "@orpc/server";
import { convertToModelMessages, streamText, UIMessage } from "ai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

const openai = createOpenAICompatible({
  name: "openai-compatible",
  baseURL: process.env.OPENAI_BASE_URL!,
  apiKey: process.env.OPENAI_API_KEY,
});

const chatHandler = os
  .input(type<{ chatId: string; messages: UIMessage[]; model: string }>())
  .handler(({ input }) => {
    console.log(input);
    try {
      const result = streamText({
        model: openai(input.model),
        messages: convertToModelMessages(input.messages),
      });

      return streamToEventIterator(result.toUIMessageStream());
    } catch (error) {
      console.error(error);
      throw error;
    }
  });

export const chat = {
  chat: chatHandler,
};
