import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { ModelSelector } from "./model-selector";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Button } from "./ui/button";
import { Zap, Brain, Crown } from "lucide-react";

interface NewGameDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedModel: string;
  onModelChange: (model: string) => void;
  difficulty: "easy" | "medium" | "hard";
  onDifficultyChange: (difficulty: "easy" | "medium" | "hard") => void;
  onStartGame: () => void;
}

export const NewGameDialog: React.FC<NewGameDialogProps> = ({
  open,
  onOpenChange,
  selectedModel,
  onModelChange,
  difficulty,
  onDifficultyChange,
  onStartGame,
}) => {
  const handleStartGame = () => {
    onStartGame();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="text-lg text-green-700 dark:text-green-400">
            New Game
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-3">
            <ModelSelector
              selectedModel={selectedModel}
              onModelChange={onModelChange}
            />
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Difficulty
            </label>
            <Select value={difficulty} onValueChange={onDifficultyChange}>
              <SelectTrigger className="h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="easy">
                  <div className="flex items-center gap-2">
                    <Zap className="h-3 w-3 text-emerald-600" />
                    <span>Easy</span>
                  </div>
                </SelectItem>
                <SelectItem value="medium">
                  <div className="flex items-center gap-2">
                    <Brain className="h-3 w-3 text-green-600" />
                    <span>Medium</span>
                  </div>
                </SelectItem>
                <SelectItem value="hard">
                  <div className="flex items-center gap-2">
                    <Crown className="h-3 w-3 text-teal-600" />
                    <span>Hard</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              onClick={() => onOpenChange(false)}
              variant="outline"
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleStartGame}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              size="lg"
            >
              Start Game
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
