import React from "react";
import { Crown, Cpu, Zap } from "lucide-react";

interface GameControlsProps {
  aiOpponent: string;
  difficulty: "easy" | "medium" | "hard";
}

export const GameControls: React.FC<GameControlsProps> = ({
  aiOpponent,
  difficulty,
}) => {
  const getDifficultyIcon = () => {
    switch (difficulty) {
      case "easy":
        return <Zap className="h-3 w-3" />;
      case "medium":
        return <Cpu className="h-3 w-3" />;
      case "hard":
        return <Crown className="h-3 w-3" />;
      default:
        return <Cpu className="h-3 w-3" />;
    }
  };

  const getDifficultyColor = () => {
    switch (difficulty) {
      case "easy":
        return "bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800";
      case "medium":
        return "bg-green-100 text-green-700 border border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800";
      case "hard":
        return "bg-teal-100 text-teal-700 border border-teal-200 dark:bg-teal-900/30 dark:text-teal-400 dark:border-teal-800";
      default:
        return "bg-gray-100 text-gray-700 border border-gray-200 dark:bg-gray-900/30 dark:text-gray-400 dark:border-gray-800";
    }
  };

  return (
    <div className="space-y-4 pt-4">
      <div className="space-y-1">
        <div className="flex items-center h-6">
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide w-20">
            Opponent
          </span>
          <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">
            {aiOpponent}
          </span>
        </div>
        <div className="flex items-center h-6">
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide w-20">
            Difficulty
          </span>
          <div
            className={`inline-flex items-center gap-1 px-2 py-0 rounded text-xs font-medium h-4 ${getDifficultyColor()}`}
          >
            {getDifficultyIcon()}
            {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
          </div>
        </div>
      </div>
    </div>
  );
};
