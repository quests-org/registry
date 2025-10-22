import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/client/components/ai-elements/conversation";
import {
  Message,
  MessageContent,
} from "@/client/components/ai-elements/message";
import {
  PromptInput,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputToolbar,
  PromptInputTools,
} from "@/client/components/ai-elements/prompt-input";
import { useState, useEffect } from "react";
import { useChat } from "@ai-sdk/react";
import { Response } from "@/client/components/ai-elements/response";

import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from "@/client/components/ai-elements/reasoning";
import { Loader } from "@/client/components/ai-elements/loader";
import { eventIteratorToStream } from "@orpc/client";
import { rpcClient, queryClient } from "@/client/rpc-client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/client/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/client/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/client/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/client/components/ui/tooltip";
import { Check, ChevronsUpDown, Plus, Download } from "lucide-react";
import { cn } from "@/client/lib/utils";

type Body = {
  model: string;
};

const Chat = () => {
  const [input, setInput] = useState("");
  const [model, setModel] = useState<string>("");
  const [open, setOpen] = useState(false);

  const {
    data: models = [],
    isLoading: isLoadingModels,
    error: modelsError,
  } = useQuery(queryClient.ai.models.queryOptions());

  useEffect(() => {
    if (models.length > 0 && !model) {
      const savedModel = localStorage.getItem("ai-chat-selected-model");
      if (savedModel && models.some((m) => m.value === savedModel)) {
        setModel(savedModel);
      } else {
        setModel(models[0].value);
      }
    }
  }, [models, model]);

  useEffect(() => {
    if (model) {
      localStorage.setItem("ai-chat-selected-model", model);
    }
  }, [model]);

  const { messages, sendMessage, status, setMessages, stop } = useChat({
    transport: {
      async sendMessages(options) {
        return eventIteratorToStream(
          await rpcClient.chat.chat(
            {
              chatId: options.chatId,
              messages: options.messages,
              model: (options.body as Body).model,
            },
            { signal: options.abortSignal }
          )
        );
      },
      reconnectToStream() {
        throw new Error("Unsupported");
      },
    },
  });
  useEffect(() => {
    const savedMessages = localStorage.getItem("ai-chat-messages");
    if (savedMessages) {
      try {
        const parsedMessages = JSON.parse(savedMessages);
        setMessages(parsedMessages);
      } catch (error) {
        console.error("Failed to parse saved messages:", error);
        localStorage.removeItem("ai-chat-messages");
      }
    }
  }, [setMessages]);
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem("ai-chat-messages", JSON.stringify(messages));
    }
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      sendMessage(
        { text: input },
        {
          body: {
            model: model,
          },
        }
      );
      setInput("");
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    setInput("");
    localStorage.removeItem("ai-chat-messages");
  };

  const handleDownloadChat = () => {
    if (messages.length === 0) return;

    const markdown = messages
      .map((message) => {
        const role = message.role === "user" ? "User" : "Assistant";
        const content = message.parts
          .map((part) => {
            if (part.type === "text") {
              return part.text;
            } else if (part.type === "reasoning") {
              return `**Reasoning:**\n${part.text}`;
            }
            return "";
          })
          .join("\n\n");

        return `## ${role}\n\n${content}`;
      })
      .join("\n\n---\n\n");

    const blob = new Blob([markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `chat-${new Date()
      .toISOString()
      .slice(0, 19)
      .replace(/:/g, "-")}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-4xl mx-auto relative size-full h-screen flex flex-col">
      <div className="sticky top-0 z-10 bg-background flex items-center justify-end p-6 pb-4">
        <div className="flex items-center gap-2">
          <Button
            onClick={handleNewChat}
            variant="ghost"
            size="sm"
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            New Chat
          </Button>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={handleDownloadChat}
                  variant="ghost"
                  size="sm"
                  disabled={messages.length === 0}
                >
                  <Download className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Download conversation as markdown</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
      <div className="flex flex-col flex-1 px-6 pb-6 min-h-0">
        {messages.length === 0 ? (
          <div className="flex-1 flex items-center">
            <div className="ml-8">
              <div className="text-2xl font-semibold">Hello.</div>
              <div className="text-2xl text-zinc-500">
                How can I help you today?
              </div>
            </div>
          </div>
        ) : (
          <Conversation className="h-full">
            <ConversationContent>
              {messages.map((message) => (
                <div key={message.id}>
                  <Message from={message.role} key={message.id}>
                    <MessageContent>
                      {message.parts.map((part, i) => {
                        switch (part.type) {
                          case "text":
                            return (
                              <Response key={`${message.id}-${i}`}>
                                {part.text}
                              </Response>
                            );
                          case "reasoning":
                            return (
                              <Reasoning
                                key={`${message.id}-${i}`}
                                className="w-full"
                                isStreaming={status === "streaming"}
                              >
                                <ReasoningTrigger />
                                <ReasoningContent>{part.text}</ReasoningContent>
                              </Reasoning>
                            );
                          default:
                            return null;
                        }
                      })}
                    </MessageContent>
                  </Message>
                </div>
              ))}
              {status === "submitted" && <Loader />}
            </ConversationContent>
            <ConversationScrollButton />
          </Conversation>
        )}

        <PromptInput onSubmit={handleSubmit} className="mt-4">
          <PromptInputTextarea
            onChange={(e) => setInput(e.target.value)}
            value={input}
          />
          <PromptInputToolbar>
            <PromptInputTools>
              {!isLoadingModels && !modelsError && models.length > 0 && (
                <Popover open={open} onOpenChange={setOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={open}
                      className="justify-between text-left font-normal"
                    >
                      <span>
                        {model
                          ? models.find((m) => m.value === model)?.name
                          : "Select model..."}
                      </span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Command>
                      <CommandInput
                        placeholder="Search models..."
                        className="h-9"
                      />
                      <CommandList>
                        <CommandEmpty>No model found.</CommandEmpty>
                        <CommandGroup>
                          {models.map((modelOption) => (
                            <CommandItem
                              key={modelOption.value}
                              value={modelOption.value}
                              onSelect={(currentValue) => {
                                setModel(
                                  currentValue === model ? "" : currentValue
                                );
                                setOpen(false);
                              }}
                            >
                              {modelOption.name}
                              <Check
                                className={cn(
                                  "ml-auto",
                                  model === modelOption.value
                                    ? "opacity-100"
                                    : "opacity-0"
                                )}
                              />
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              )}
            </PromptInputTools>
            <PromptInputSubmit
              disabled={!input && status !== "streaming"}
              status={status}
              onStop={stop}
            />
          </PromptInputToolbar>
        </PromptInput>
      </div>
    </div>
  );
};

export default Chat;
