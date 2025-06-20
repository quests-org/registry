import React from "react";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "../rpc-client";

interface ModelOption {
  id: string;
  name: string;
  provider: string;
}

// Helper function to parse model info from model name
const parseModelInfo = (modelName: string): ModelOption => {
  const id = modelName;
  let name = modelName;
  let provider = "Unknown";

  // Parse provider and name from common patterns
  if (modelName.includes("/")) {
    const [providerPrefix, modelPart] = modelName.split("/", 2);

    // Map provider prefixes to display names
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

    // Clean up model names
    name = modelPart
      .replace(/-/g, " ")
      .replace(/\b\w/g, (l) => l.toUpperCase())
      .replace(/Gpt/g, "GPT")
      .replace(/Claude/g, "Claude")
      .replace(/Llama/g, "Llama");
  }

  return { id, name, provider };
};

// Hook to get available models
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
