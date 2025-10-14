import React from "react";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "../rpc-client";

interface ModelOption {
  id: string;
  name: string;
  provider: string;
}
const parseModelInfo = (modelName: string): ModelOption => {
  const id = modelName;
  let name = modelName;
  let provider = "Unknown";
  if (modelName.includes("/")) {
    const [providerPrefix, modelPart] = modelName.split("/", 2);
    const providerMap: Record<string, string> = {
      openai: "OpenAI",
      anthropic: "Anthropic",
      google: "Google",
      mistralai: "Mistral AI",
      "meta-llama": "Meta",
      cohere: "Cohere",
      perplexity: "Perplexity",
    };

    provider = providerMap[providerPrefix] || providerPrefix;
    name = modelPart
      .replace(/-/g, " ")
      .replace(/\b\w/g, (l) => l.toUpperCase())
      .replace(/Gpt/g, "GPT")
      .replace(/Claude/g, "Claude")
      .replace(/Llama/g, "Llama");
  }

  return { id, name, provider };
};
export const useAvailableModels = () => {
  const {
    data: modelsData,
    isLoading,
    error,
  } = useQuery(queryClient.ai.models.queryOptions());

  const models = React.useMemo(() => {
    if (error || !modelsData) {
      return [];
    }

    return modelsData.map((model) => parseModelInfo(model.value));
  }, [modelsData, error]);

  return { models, isLoading, error };
};
