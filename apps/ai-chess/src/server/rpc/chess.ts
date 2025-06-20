import { os, type } from "@orpc/server";
import { generateText } from "ai";
import { Chess } from "chess.js";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

const openai = createOpenAICompatible({
  name: "openai-compatible",
  baseURL: process.env.OPENAI_BASE_URL!,
  apiKey: process.env.OPENAI_API_KEY,
});

const generateChessMove = os
  .input(
    type<{
      fen: string;
      model: string;
      difficulty?: "easy" | "medium" | "hard";
    }>()
  )
  .handler(async ({ input }) => {
    const { fen, model, difficulty = "medium" } = input;

    console.log("🔄 SERVER: Generating chess move...");
    console.log(`📋 FEN: ${fen}`);
    console.log(`🤖 Model: ${model}`);
    console.log(`⚡ Difficulty: ${difficulty}`);

    // Validate the FEN and get legal moves
    const chess = new Chess(fen);
    const legalMoves = chess.moves();

    if (legalMoves.length === 0) {
      throw new Error("No legal moves available");
    }

    // Create a prompt for the AI to choose a chess move
    const systemPrompt = `You are a chess AI opponent. Given a chess position in FEN notation, you must choose the best move.

Rules:
1. You must respond with ONLY a valid chess move in standard algebraic notation (e.g., "e4", "Nf3", "O-O", "Qxh7+")
2. The move must be legal in the current position
3. Consider tactics, strategy, and piece safety
4. Your difficulty level is: ${difficulty}

${
  difficulty === "easy"
    ? "Play at beginner level - make simple, safe moves. Avoid complex tactics."
    : ""
}
${
  difficulty === "medium"
    ? "Play at intermediate level - consider basic tactics and positional play."
    : ""
}
${
  difficulty === "hard"
    ? "Play at advanced level - look for complex tactics, sacrifices, and deep positional understanding."
    : ""
}

Current position (FEN): ${fen}
Legal moves available: ${legalMoves.join(", ")}

Choose your move:`;

    const result = await generateText({
      model: openai(model),
      prompt: systemPrompt,
      temperature:
        difficulty === "easy" ? 0.3 : difficulty === "medium" ? 0.5 : 0.7,
    });

    let aiMove = result.text.trim();

    // Clean up the AI response - sometimes it includes extra text
    const moveMatch = aiMove.match(
      /([a-h][1-8]|[KQRBN][a-h]?[1-8]?x?[a-h][1-8]|O-O(-O)?|\+|#|[a-h]x[a-h][1-8]|[KQRBN]x[a-h][1-8])/
    );
    if (moveMatch) {
      aiMove = moveMatch[0];
    }

    // Validate that the AI move is legal
    if (!legalMoves.includes(aiMove)) {
      console.warn("⚠️  SERVER: AI generated invalid move:", aiMove);
      console.warn("📝 Legal moves:", legalMoves);
      // Fallback to a random legal move
      aiMove = legalMoves[Math.floor(Math.random() * legalMoves.length)];
      console.log("🎲 SERVER: Using random fallback move:", aiMove);
    }

    // Test the move to make sure it's valid
    const testChess = new Chess(fen);
    try {
      testChess.move(aiMove);
      console.log("✅ SERVER: Move validation successful");
    } catch (error) {
      console.error("❌ SERVER: Move validation failed:", error);
      // Fallback to first legal move
      aiMove = legalMoves[0];
      console.log("🔄 SERVER: Using first legal move as fallback:", aiMove);
    }

    console.log("🎯 SERVER: Final generated move:", aiMove);

    return { move: aiMove };
  });

export const chess = {
  generateMove: generateChessMove,
};
