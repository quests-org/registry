import { useState, useCallback } from "react";
import { Chess, Square, Move } from "chess.js";

export type GameStatus = "playing" | "checkmate" | "draw" | "check";
export type PlayerColor = "white" | "black";

// Define the piece type that chess.js returns
type ChessPiece = {
  square: Square;
  type: string;
  color: string;
} | null;

interface ChessGameState {
  chess: Chess;
  board: (string | null)[][];
  currentPlayer: PlayerColor;
  gameStatus: GameStatus;
  selectedSquare: Square | null;
  legalMoves: Square[];
  moveHistory: Move[];
  isThinking: boolean;
}

interface ChessGameActions {
  makeMove: (from: Square, to: Square) => boolean;
  selectSquare: (square: Square) => void;
  resetGame: () => void;
  undoMove: () => void;
  setThinking: (thinking: boolean) => void;
  makeMoveFromNotation: (move: string) => boolean;
}

// Helper function to convert chess.js piece objects to string format
const convertBoardToStringFormat = (
  chessBoardData: ChessPiece[][]
): (string | null)[][] => {
  return chessBoardData.map((rank) =>
    rank.map((piece) => (piece ? `${piece.color}${piece.type}` : null))
  );
};

const createInitialState = (): ChessGameState => {
  const chess = new Chess();
  return {
    chess,
    board: convertBoardToStringFormat(chess.board() as ChessPiece[][]),
    currentPlayer: "white",
    gameStatus: "playing",
    selectedSquare: null,
    legalMoves: [],
    moveHistory: [],
    isThinking: false,
  };
};

export function useChessGame(): ChessGameState & ChessGameActions {
  const [gameState, setGameState] =
    useState<ChessGameState>(createInitialState);

  const updateGameState = useCallback(
    (updater: (state: ChessGameState) => Partial<ChessGameState>) => {
      setGameState((prevState) => {
        const updates = updater(prevState);
        return { ...prevState, ...updates };
      });
    },
    []
  );

  const getGameStatus = useCallback((chess: Chess): GameStatus => {
    if (chess.isCheckmate()) return "checkmate";
    if (chess.isDraw()) return "draw";
    if (chess.inCheck()) return "check";
    return "playing";
  }, []);

  const makeMove = useCallback(
    (from: Square, to: Square): boolean => {
      try {
        const move = gameState.chess.move({ from, to, promotion: "q" });
        if (move) {
          const newStatus = getGameStatus(gameState.chess);
          const newPlayer: PlayerColor =
            gameState.chess.turn() === "w" ? "white" : "black";

          updateGameState(() => ({
            board: convertBoardToStringFormat(
              gameState.chess.board() as ChessPiece[][]
            ),
            currentPlayer: newPlayer,
            gameStatus: newStatus,
            selectedSquare: null,
            legalMoves: [],
            moveHistory: gameState.chess.history({ verbose: true }),
          }));

          return true;
        }
      } catch (error) {
        console.error("Invalid move:", error);
      }
      return false;
    },
    [gameState.chess, getGameStatus, updateGameState]
  );

  const makeMoveFromNotation = useCallback(
    (move: string): boolean => {
      try {
        const moveResult = gameState.chess.move(move);
        if (moveResult) {
          const newStatus = getGameStatus(gameState.chess);
          const newPlayer: PlayerColor =
            gameState.chess.turn() === "w" ? "white" : "black";

          updateGameState(() => ({
            board: convertBoardToStringFormat(
              gameState.chess.board() as ChessPiece[][]
            ),
            currentPlayer: newPlayer,
            gameStatus: newStatus,
            selectedSquare: null,
            legalMoves: [],
            moveHistory: gameState.chess.history({ verbose: true }),
          }));

          return true;
        }
      } catch (error) {
        console.error("Invalid move notation:", error);
      }
      return false;
    },
    [gameState.chess, getGameStatus, updateGameState]
  );

  const selectSquare = useCallback(
    (square: Square) => {
      if (gameState.selectedSquare === square) {
        // Deselect if clicking the same square
        updateGameState(() => ({
          selectedSquare: null,
          legalMoves: [],
        }));
        return;
      }

      if (gameState.selectedSquare) {
        // Try to make a move
        const moveSuccess = makeMove(gameState.selectedSquare, square);
        if (!moveSuccess) {
          // If move failed, select the new square
          const piece = gameState.chess.get(square);
          if (piece && piece.color === gameState.chess.turn()) {
            const moves = gameState.chess.moves({ square, verbose: true });
            const legalMoves = moves.map((move) => move.to);

            updateGameState(() => ({
              selectedSquare: square,
              legalMoves,
            }));
          } else {
            updateGameState(() => ({
              selectedSquare: null,
              legalMoves: [],
            }));
          }
        }
      } else {
        // Select square if it has a piece of the current player
        const piece = gameState.chess.get(square);
        if (piece && piece.color === gameState.chess.turn()) {
          const moves = gameState.chess.moves({ square, verbose: true });
          const legalMoves = moves.map((move) => move.to);

          updateGameState(() => ({
            selectedSquare: square,
            legalMoves,
          }));
        }
      }
    },
    [gameState.chess, gameState.selectedSquare, makeMove, updateGameState]
  );

  const resetGame = useCallback(() => {
    setGameState(createInitialState());
  }, []);

  const undoMove = useCallback(() => {
    gameState.chess.undo();
    const newStatus = getGameStatus(gameState.chess);
    const newPlayer: PlayerColor =
      gameState.chess.turn() === "w" ? "white" : "black";

    updateGameState(() => ({
      board: convertBoardToStringFormat(
        gameState.chess.board() as ChessPiece[][]
      ),
      currentPlayer: newPlayer,
      gameStatus: newStatus,
      selectedSquare: null,
      legalMoves: [],
      moveHistory: gameState.chess.history({ verbose: true }),
    }));
  }, [gameState.chess, getGameStatus, updateGameState]);

  const setThinking = useCallback(
    (thinking: boolean) => {
      updateGameState(() => ({ isThinking: thinking }));
    },
    [updateGameState]
  );

  return {
    ...gameState,
    makeMove,
    selectSquare,
    resetGame,
    undoMove,
    setThinking,
    makeMoveFromNotation,
  };
}
