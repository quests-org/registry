# AI Chess

Can you beat an LLM at chess?

## How to Play

1. **Start a Game**: Click the "New Game" button to open the game configuration dialog
2. **Choose Your Opponent**: Select from 9 different AI models ranging from GPT-3.5 to Claude 3 Opus
3. **Set Difficulty**: Choose Easy (beginner-friendly), Medium (balanced), or Hard (advanced strategy)
4. **Random Color Assignment**: Your piece color (white/black) is randomly assigned for fairness
5. **Make Moves**: Click on a piece to select it, then click on a highlighted square to move
6. **AI Responds**: The AI automatically calculates and makes its move (watch for the "thinking..." indicator)
7. **Track Progress**: View move history in the sidebar and see whose turn it is with visual indicators

## Dependencies

- [TypeScript](https://www.typescriptlang.org/)
- [React](https://react.dev/)
- [Vite](https://vite.dev/)
- [Tailwind CSS V4](https://tailwindcss.com/)
- [ORPC](https://orpc.unnoq.com/)
- [Hono](https://hono.dev/)
- [Chess.js](https://github.com/jhlywa/chess.js) - Chess game logic
- [AI SDK](https://ai-sdk.dev/docs/introduction) - AI model integration
- [OpenRouter](https://openrouter.ai/) - AI model provider
- [Radix UI](https://www.radix-ui.com/) - UI components
- [Lucide React](https://lucide.dev/) - Icons

## Architecture

The app is structured as a full-stack application:

- **Frontend**: React with TypeScript, using custom hooks for game state management
- **Backend**: Hono server with AI move generation endpoints
- **Chess Logic**: Chess.js library for game rules and validation
- **AI Integration**: OpenRouter for accessing multiple AI models (GPT, Claude, Gemini, etc.)
- **UI Framework**: Radix UI primitives with Tailwind CSS styling

## API Endpoints

- `POST /api/chess/move` - Generate AI chess moves
  - Body: `{ fen: string, model: string, difficulty: string }`
  - Response: `{ move: string }`
