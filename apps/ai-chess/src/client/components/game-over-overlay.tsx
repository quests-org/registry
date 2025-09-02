import React from "react";
import { Crown, Trophy, Users, X } from "lucide-react";
import { GameStatus, PlayerColor } from "../hooks/use-chess-game";

interface GameOverOverlayProps {
  gameStatus: GameStatus;
  aiOpponent: string;
  playerColor: PlayerColor;
  currentPlayer: PlayerColor;
  isVisible: boolean;
  onDismiss: () => void;
}

export const GameOverOverlay: React.FC<GameOverOverlayProps> = ({
  gameStatus,
  aiOpponent,
  playerColor,
  currentPlayer,
  isVisible,
  onDismiss,
}) => {
  const isGameOver = gameStatus === "checkmate" || gameStatus === "draw";

  const getWinner = () => {
    if (gameStatus === "checkmate") {
      const winner = currentPlayer === "white" ? "black" : "white";
      return winner === playerColor ? "player" : "ai";
    }
    return null;
  };

  const getGameOverMessage = () => {
    if (gameStatus === "draw") {
      return {
        title: "It's a Draw!",
        subtitle: "Good game!",
        icon: <Users className="h-8 w-8" />,
        bgColor: "bg-yellow-100 dark:bg-yellow-900/90",
        textColor: "text-yellow-800 dark:text-yellow-200",
        borderColor: "border-yellow-300 dark:border-yellow-700",
      };
    }

    const winner = getWinner();
    if (winner === "player") {
      return {
        title: "You Won!",
        subtitle: `Congratulations! You defeated ${aiOpponent}!`,
        icon: <Trophy className="h-8 w-8" />,
        bgColor: "bg-green-100 dark:bg-green-900/90",
        textColor: "text-green-800 dark:text-green-200",
        borderColor: "border-green-300 dark:border-green-700",
      };
    } else if (winner === "ai") {
      return {
        title: `${aiOpponent} Won!`,
        subtitle: "Better luck next time!",
        icon: <Crown className="h-8 w-8" />,
        bgColor: "bg-red-100 dark:bg-red-900/90",
        textColor: "text-red-800 dark:text-red-200",
        borderColor: "border-red-300 dark:border-red-700",
      };
    }

    return null;
  };

  const gameOverInfo = getGameOverMessage();

  if (!isGameOver || !gameOverInfo || !isVisible) {
    return null;
  }

  return (
    <div className="absolute inset-0 flex items-center justify-center z-50">
      <div
        className={`relative rounded-xl p-6 border-2 shadow-2xl max-w-sm mx-4 ${gameOverInfo.bgColor} ${gameOverInfo.borderColor} animate-in zoom-in-95 duration-300`}
      >
        <button
          onClick={onDismiss}
          className={`absolute top-3 right-3 p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors ${gameOverInfo.textColor}`}
        >
          <X className="h-4 w-4" />
        </button>

        <div className="text-center">
          <div className={`flex justify-center mb-4 ${gameOverInfo.textColor}`}>
            {gameOverInfo.icon}
          </div>
          <h2 className={`text-2xl font-bold mb-2 ${gameOverInfo.textColor}`}>
            {gameOverInfo.title}
          </h2>
          <p className={`text-sm ${gameOverInfo.textColor} opacity-90`}>
            {gameOverInfo.subtitle}
          </p>
        </div>
      </div>
    </div>
  );
};
