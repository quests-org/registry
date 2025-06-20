import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { useAvailableModels } from "../hooks/use-available-models";

interface ModelSelectorProps {
  selectedModel: string;
  onModelChange: (modelId: string) => void;
  disabled?: boolean;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({
  selectedModel,
  onModelChange,
  disabled = false,
}) => {
  const { models, isLoading } = useAvailableModels();
  const selectedModelData = models.find((m) => m.id === selectedModel);

  return (
    <div className="grid gap-3">
      <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
        AI Opponent
      </label>

      <Select
        value={selectedModel}
        onValueChange={onModelChange}
        disabled={disabled || isLoading}
      >
        <SelectTrigger className="h-10">
          <SelectValue
            placeholder={
              isLoading ? "Loading models..." : "Choose an AI model..."
            }
          >
            {selectedModelData && !isLoading && (
              <div className="flex items-center gap-2">
                <span className="font-medium">{selectedModelData.name}</span>
                <span className="text-xs text-muted-foreground">
                  {selectedModelData.provider}
                </span>
              </div>
            )}
          </SelectValue>
        </SelectTrigger>

        <SelectContent>
          {models.map((model) => (
            <SelectItem key={model.id} value={model.id}>
              <div className="flex items-center gap-2">
                <span className="font-medium">{model.name}</span>
                <span className="text-xs text-muted-foreground">
                  {model.provider}
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
