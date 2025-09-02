import React from "react";
import { Square } from "chess.js";
import { ChessPiece } from "./chess-piece";
import { cn } from "../lib/utils";
import { Brain } from "lucide-react";

interface ChessBoardProps {
  board: (string | null)[][];
  selectedSquare: Square | null;
  legalMoves: Square[];
  onSquareClick: (square: Square) => void;
  isPlayerTurn: boolean;
  lastMove?: { from: Square; to: Square } | null;
  playerColor: "white" | "black";
  aiOpponent: string;
  isThinking: boolean;
  currentPlayer: "white" | "black";
  children?: React.ReactNode;
}

const ChessBoard: React.FC<ChessBoardProps> = ({
  board,
  selectedSquare,
  legalMoves,
  onSquareClick,
  isPlayerTurn,
  lastMove,
  playerColor,
  aiOpponent,
  isThinking,
  currentPlayer,
  children,
}) => {
  const files = ["a", "b", "c", "d", "e", "f", "g", "h"];
  const ranks = ["8", "7", "6", "5", "4", "3", "2", "1"];
  const displayFiles = playerColor === "black" ? [...files].reverse() : files;
  const displayRanks = playerColor === "black" ? [...ranks].reverse() : ranks;
  const displayBoard =
    playerColor === "black"
      ? board.map((rank) => [...rank].reverse()).reverse()
      : board;

  const getSquareName = (rank: number, file: number): Square => {
    if (playerColor === "black") {
      const actualRank = 7 - rank;
      const actualFile = 7 - file;
      return `${files[actualFile]}${ranks[actualRank]}` as Square;
    }
    return `${files[file]}${ranks[rank]}` as Square;
  };

  const isLight = (rank: number, file: number): boolean => {
    return (rank + file) % 2 === 0;
  };

  const isSelected = (square: Square): boolean => {
    return selectedSquare === square;
  };

  const isLegalMove = (square: Square): boolean => {
    return legalMoves.includes(square);
  };

  const isLastMove = (square: Square): boolean => {
    return lastMove
      ? lastMove.from === square || lastMove.to === square
      : false;
  };
  const topPlayer = {
    name: aiOpponent,
    color: playerColor === "white" ? "black" : "white",
    isAI: true,
  };
  const bottomPlayer = {
    name: "You",
    color: playerColor,
    isAI: false,
  };
  const isTopPlayerTurn = topPlayer.color === currentPlayer;
  const isBottomPlayerTurn = bottomPlayer.color === currentPlayer;

  return (
    <div className="relative">
      <div className="flex justify-center mb-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
            <div
              className={`w-3 h-3 rounded-full ${
                topPlayer.color === "white"
                  ? "bg-white border-2 border-slate-600"
                  : "bg-slate-900 dark:bg-black"
              }`}
            ></div>
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {topPlayer.name}
            </span>
            {topPlayer.isAI && (
              <>
                <span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full">
                  AI
                </span>
                {isThinking && (
                  <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 animate-pulse">
                    <Brain className="h-3 w-3" />
                    <span>thinking...</span>
                  </div>
                )}
              </>
            )}
          </div>
          {isTopPlayerTurn && (
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          )}
        </div>
      </div>

      <div className="flex justify-center mb-3">
        <div className="grid grid-cols-8 gap-0 w-[480px]">
          {displayFiles.map((file) => (
            <div
              key={file}
              className="text-center text-sm font-semibold text-muted-foreground chess-coordinate"
            >
              {file}
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex flex-col gap-0">
          {displayRanks.map((rank) => (
            <div
              key={rank}
              className="h-[60px] flex items-center justify-center text-sm font-semibold text-muted-foreground w-6 chess-coordinate"
            >
              {rank}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-8 gap-0 rounded-lg overflow-hidden border-4 border-slate-700 w-[480px] h-[480px] chess-board shadow-2xl">
          {displayBoard.map((rank, rankIndex) =>
            rank.map((piece, fileIndex) => {
              const square = getSquareName(rankIndex, fileIndex);
              const isLightSquare = isLight(rankIndex, fileIndex);
              const isSquareSelected = isSelected(square);
              const isSquareLegalMove = isLegalMove(square);
              const isSquareLastMove = isLastMove(square);

              return (
                <button
                  key={square}
                  className={cn(
                    "w-[60px] h-[60px] relative flex items-center justify-center border-none outline-none chess-square",
                    {
                      "bg-stone-100": isLightSquare,
                      "bg-amber-600": !isLightSquare,
                      "cursor-pointer": isPlayerTurn,
                      "cursor-not-allowed opacity-75": !isPlayerTurn,
                    },
                    isSquareSelected && "selected",
                    isSquareLegalMove && "legal-move",
                    isSquareLegalMove && piece && "has-piece",
                    isSquareLastMove && "last-move"
                  )}
                  onClick={() => isPlayerTurn && onSquareClick(square)}
                  disabled={!isPlayerTurn}
                >
                  {piece && (
                    <ChessPiece
                      piece={piece}
                      size={48}
                      className="z-10 relative drop-shadow-sm"
                    />
                  )}
                </button>
              );
            })
          )}
        </div>

        <div className="flex flex-col gap-0">
          {displayRanks.map((rank) => (
            <div
              key={rank}
              className="h-[60px] flex items-center justify-center text-sm font-semibold text-muted-foreground w-6 chess-coordinate"
            >
              {rank}
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-center mt-3">
        <div className="grid grid-cols-8 gap-0 w-[480px]">
          {displayFiles.map((file) => (
            <div
              key={file}
              className="text-center text-sm font-semibold text-muted-foreground chess-coordinate"
            >
              {file}
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-center mt-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
            <div
              className={`w-3 h-3 rounded-full ${
                bottomPlayer.color === "white"
                  ? "bg-white border-2 border-slate-600"
                  : "bg-slate-900 dark:bg-black"
              }`}
            ></div>
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {bottomPlayer.name}
            </span>
            {bottomPlayer.isAI && (
              <>
                <span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full">
                  AI
                </span>
                {isThinking && (
                  <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 animate-pulse">
                    <Brain className="h-3 w-3" />
                    <span>thinking...</span>
                  </div>
                )}
              </>
            )}
          </div>
          {isBottomPlayerTurn && (
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          )}
        </div>
      </div>

      {children}
    </div>
  );
};

export default ChessBoard;
