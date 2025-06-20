import { os, streamToEventIterator, type } from "@orpc/server";
import { convertToModelMessages, streamText, UIMessage } from "ai";
import { call } from "@orpc/server";
import { fileRouter, UploadedFile } from "@/server/rpc/file";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

const openai = createOpenAICompatible({
  name: "openai",
  baseURL: process.env.OPENAI_BASE_URL!,
  apiKey: process.env.OPENAI_API_KEY,
});

const chatHandler = os
  .input(type<{ chatId: string; messages: UIMessage[]; fileIds: string[] }>())
  .handler(async ({ input }) => {
    console.log(input);
    try {
      const chatMessages = convertToModelMessages(input.messages);

      // If there are files in the context, add information about them to the system message
      if (input.fileIds && input.fileIds.length > 0) {
        // Fetch file information for all requested file IDs
        const filePromises = input.fileIds.map(async (id: string) => {
          try {
            return call(fileRouter.get, { id });
          } catch (error) {
            console.error(`Error fetching file with ID ${id}:`, error);
            return null;
          }
        });

        const files: UploadedFile[] = (await Promise.all(filePromises)).filter(
          (file): file is UploadedFile => file !== null
        );

        if (files.length > 0) {
          const fileSummary = files
            .map((file) =>
              [
                `- Name: ${file.name}`,
                `- Type: ${file.type}`,
                `- Size: ${file.size}`,
              ].join("\n")
            )
            .join("\n");

          const fileParts = files.map((file) =>
            ["image/png", "image/jpeg", "image/gif", "image/webp"].includes(
              file.type
            )
              ? {
                  type: "image" as const,
                  image: file.buffer,
                  mimeType: file.type,
                }
              : file.type === "application/pdf"
              ? {
                  type: "file" as const,
                  data: file.buffer,
                  mediaType: file.type,
                  filename: file.name,
                }
              : {
                  type: "text" as const,
                  text: file.buffer.toString("utf-8").slice(0, 100_000),
                }
          );

          // Add file content as a separate user message
          chatMessages.push({
            role: "user",
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            content: [{ type: "text", text: fileSummary }, ...fileParts] as any, // Type assertion to handle complex content types
          });
        }
      }

      const result = streamText({
        model: openai("gpt-5-mini"),
        messages: [
          {
            role: "system",
            content:
              "The user is going to ask you questions about the attached files. Give them an error message if no files are attached.",
          },
          ...chatMessages,
        ],
        onError: (error) => {
          console.error("Error streaming text:", error);
        },
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
