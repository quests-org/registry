import React, { useState, useEffect, useCallback, useRef } from "react";
import { Square } from "chess.js";
import ChessBoard from "./components/chess-board";
import { GameControls } from "./components/game-controls";
import { NewGameDialog } from "./components/new-game-dialog";
import { GameOverOverlay } from "./components/game-over-overlay";
import { useChessGame } from "./hooks/use-chess-game";
import { useAvailableModels } from "./hooks/use-available-models";
import { Button } from "./components/ui/button";
import { Play } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "./rpc-client";

function App() {
  // Game state
  const {
    chess,
    board,
    currentPlayer,
    gameStatus,
    selectedSquare,
    legalMoves,
    moveHistory,
    isThinking,
    makeMove,
    selectSquare,
    resetGame,
    setThinking,
    makeMoveFromNotation,
  } = useChessGame();

  // Get available models
  const { models } = useAvailableModels();

  // Settings state
  const [selectedModel, setSelectedModel] = useState(() => {
    // Use first available model or empty string if none available
    return models.length > 0 ? models[0].id : "";
  });
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">(
    "medium"
  );
  const [playerColor, setPlayerColor] = useState<"white" | "black">("white");
  const [isNewGameOpen, setIsNewGameOpen] = useState(false);
  const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(
    null
  );
  const [isOverlayVisible, setIsOverlayVisible] = useState(true);
  const [hasInitialized, setHasInitialized] = useState(false);

  // Handle new game with random color assignment
  const handleNewGame = useCallback(() => {
    // Randomly assign player color
    const randomColor: "white" | "black" =
      Math.random() < 0.5 ? "white" : "black";

    console.log("🆕 NEW GAME STARTED");
    console.log(`👤 Human player: ${randomColor}`);
    console.log(
      `🤖 AI opponent: ${randomColor === "white" ? "black" : "white"}`
    );
    console.log(`⚪ White goes first`);
    console.log(`🎯 Starting turn: white`);

    if (randomColor === "black") {
      console.log(`🤖 AI will move first (playing as white)`);
    } else {
      console.log(`👤 Human will move first (playing as white)`);
    }

    setPlayerColor(randomColor);
    resetGame();
    setLastMove(null);
    setIsOverlayVisible(true);
  }, [resetGame]);

  // Update selected model when models are loaded
  useEffect(() => {
    if (
      models.length > 0 &&
      (!selectedModel || !models.find((m) => m.id === selectedModel))
    ) {
      setSelectedModel(models[0].id);
    }
  }, [models, selectedModel]);

  // Auto-start a new game when the app first loads and models are available
  useEffect(() => {
    if (models.length > 0 && !hasInitialized) {
      console.log("🚀 Auto-starting initial game...");
      handleNewGame();
      setHasInitialized(true);
    }
  }, [models, hasInitialized, handleNewGame]);

  // Use ref to track if AI move is in progress to prevent multiple simultaneous moves
  const aiMoveInProgressRef = useRef(false);

  // Stable function to handle AI move completion
  const handleAIMoveComplete = useCallback(
    (data: { move?: string } | null) => {
      setThinking(false);
      aiMoveInProgressRef.current = false;

      if (data?.move) {
        console.log(`🤖 AI MOVE: ${data.move}`);
        console.log(`🎯 Current player: ${currentPlayer}`);

        // Get move details before making the move
        const moves = chess.moves({ verbose: true });
        const moveDetail = moves.find(
          (m) => m.san === data.move || m.lan === data.move
        );

        if (moveDetail) {
          console.log(`📍 Move details: ${moveDetail.from} → ${moveDetail.to}`);
        }

        const success = makeMoveFromNotation(data.move);
        if (success && moveDetail) {
          setLastMove({ from: moveDetail.from, to: moveDetail.to });
          console.log(
            `✅ AI move successful. Next turn: ${
              currentPlayer === "white" ? "black" : "white"
            }`
          );
        } else {
          console.log(`❌ AI move failed`);
        }
      } else {
        console.log(`❌ AI move generation failed - no move returned`);
      }
    },
    [chess, makeMoveFromNotation, setThinking, currentPlayer]
  );

  // AI move generation using ORPC
  const generateMoveMutation = useMutation(
    queryClient.chess.generateMove.mutationOptions({
      onSuccess: handleAIMoveComplete,
      onError: (error) => {
        console.error("Error generating AI move:", error);
        handleAIMoveComplete(null);
      },
    })
  );

  // Effect to trigger AI moves - only depends on core game state
  useEffect(() => {
    // Don't generate move if game is over
    if (gameStatus === "checkmate" || gameStatus === "draw") return;

    // Don't generate move if AI move already in progress
    if (aiMoveInProgressRef.current || isThinking) return;

    // Check if it's AI's turn
    const isAITurn =
      (playerColor === "white" && currentPlayer === "black") ||
      (playerColor === "black" && currentPlayer === "white");

    if (!isAITurn || !selectedModel) return;

    const timer = setTimeout(() => {
      // Double-check conditions before making the move to prevent race conditions
      if (aiMoveInProgressRef.current || isThinking) {
        return;
      }

      // Re-check game status to avoid race conditions
      const currentGameStatus = chess.isCheckmate()
        ? "checkmate"
        : chess.isDraw()
        ? "draw"
        : chess.inCheck()
        ? "check"
        : "playing";

      if (currentGameStatus === "checkmate" || currentGameStatus === "draw") {
        return;
      }

      const currentIsAITurn =
        (playerColor === "white" && currentPlayer === "black") ||
        (playerColor === "black" && currentPlayer === "white");

      if (currentIsAITurn && selectedModel) {
        console.log(
          `🤖 AI TURN: Starting move generation for ${currentPlayer}`
        );
        console.log(
          `🎮 Using model: ${selectedModel} (difficulty: ${difficulty})`
        );

        aiMoveInProgressRef.current = true;
        setThinking(true);

        generateMoveMutation.mutate({
          fen: chess.fen(),
          model: selectedModel,
          difficulty,
        });
      }
    }, 500); // Small delay for better UX

    return () => clearTimeout(timer);
    // Note: Intentionally not including generateMoveMutation in dependencies
    // to avoid infinite re-renders. The mutation function is stable enough for this use case.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    currentPlayer,
    gameStatus,
    playerColor,
    selectedModel,
    isThinking,
    chess,
    difficulty,
    setThinking,
  ]);

  // Handle player moves
  const handleSquareClick = (square: Square) => {
    const isPlayerTurn =
      (playerColor === "white" && currentPlayer === "white") ||
      (playerColor === "black" && currentPlayer === "black");

    if (!isPlayerTurn || isThinking) return;

    if (selectedSquare && selectedSquare !== square) {
      // Attempt to make a move
      const moves = chess.moves({ verbose: true });
      const moveDetail = moves.find(
        (m) => m.from === selectedSquare && m.to === square
      );

      if (moveDetail) {
        console.log(
          `👤 HUMAN MOVE: ${moveDetail.san} (${selectedSquare} → ${square})`
        );
        console.log(`🎯 Current player: ${currentPlayer}`);

        const success = makeMove(selectedSquare, square);
        if (success) {
          setLastMove({ from: selectedSquare, to: square });
          console.log(
            `✅ Move successful. Next turn: ${
              currentPlayer === "white" ? "black" : "white"
            }`
          );
        } else {
          console.log(`❌ Move failed`);
        }
      } else {
        // If not a valid move, try to select the new square
        selectSquare(square);
      }
    } else {
      selectSquare(square);
    }
  };

  // Handle dismissing the game over overlay
  const handleDismissOverlay = () => {
    setIsOverlayVisible(false);
  };

  // Handle starting a new game from the dialog
  const handleStartNewGame = () => {
    console.log("🎮 Starting new game from dialog...");
    handleNewGame();
    setIsOverlayVisible(true);
  };

  const isPlayerTurn =
    (playerColor === "white" && currentPlayer === "white") ||
    (playerColor === "black" && currentPlayer === "black");

  return (
    <div className="min-h-screen bg-green-50 dark:bg-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold mb-3 text-green-700 dark:text-green-400">
            AI Chess
          </h1>
          <p className="text-lg text-muted-foreground font-medium">
            Which model can you beat?
          </p>
        </div>

        <div className="flex flex-row gap-8 justify-center items-start">
          <div className="flex-shrink-0">
            <ChessBoard
              board={board}
              selectedSquare={selectedSquare}
              legalMoves={legalMoves}
              onSquareClick={handleSquareClick}
              isPlayerTurn={isPlayerTurn && !isThinking}
              lastMove={lastMove}
              playerColor={playerColor}
              aiOpponent={
                models.find((m) => m.id === selectedModel)?.name || "AI"
              }
              isThinking={isThinking}
              currentPlayer={currentPlayer}
            >
              <GameOverOverlay
                gameStatus={gameStatus}
                aiOpponent={
                  models.find((m) => m.id === selectedModel)?.name || "AI"
                }
                playerColor={playerColor}
                currentPlayer={currentPlayer}
                isVisible={isOverlayVisible}
                onDismiss={handleDismissOverlay}
              />
            </ChessBoard>
          </div>

          <div className="w-56 pt-16">
            <Button
              onClick={() => setIsNewGameOpen(true)}
              className="px-3 text-xs font-medium bg-green-600 hover:bg-green-700 text-white"
              size="sm"
            >
              <Play className="h-3 w-3 mr-1" />
              New Game
            </Button>

            <GameControls
              aiOpponent={
                models.find((m) => m.id === selectedModel)?.name || "Unknown"
              }
              difficulty={difficulty}
            />

            {moveHistory.length > 0 && (
              <div className="space-y-2 pt-2">
                <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Move History
                </h3>
                <div className="space-y-1">
                  {moveHistory
                    .reduce((pairs, move, index) => {
                      if (index % 2 === 0) {
                        pairs.push([move]);
                      } else {
                        pairs[pairs.length - 1].push(move);
                      }
                      return pairs;
                    }, [] as Array<Array<{ san: string }>>)
                    .map((pair, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 text-xs"
                      >
                        <span className="text-gray-500 font-medium w-4">
                          {index + 1}.
                        </span>
                        <span className="font-mono text-gray-900 dark:text-gray-100 min-w-0 flex-1">
                          {pair[0].san}
                        </span>
                        {pair[1] && (
                          <span className="font-mono text-gray-900 dark:text-gray-100 min-w-0 flex-1">
                            {pair[1].san}
                          </span>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* New Game Dialog */}
      <NewGameDialog
        open={isNewGameOpen}
        onOpenChange={setIsNewGameOpen}
        selectedModel={selectedModel}
        onModelChange={setSelectedModel}
        difficulty={difficulty}
        onDifficultyChange={setDifficulty}
        onStartGame={handleStartNewGame}
      />
    </div>
  );
}

export default App;
