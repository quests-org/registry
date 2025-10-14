# Agent Guidelines for AI Chess App

This app demonstrates an AI-powered chess game with model selection. Follow these guidelines to help users extend the app effectively.

## App Architecture Overview

This app uses a **client-server architecture** with:

- **Primary language**: TypeScript
- **Frontend**: React 19 + Vite + Tailwind CSS 4 + shadcn/ui
- **Backend**: Hono server with oRPC for type-safe APIs
- **AI Integration**: AI SDK with chess.js for game logic
- **Full-stack type safety** between client and server

## Critical Dependencies - DO NOT MODIFY

These dependencies are carefully configured and should **NOT** be changed:

- **Tailwind CSS v4** - Uses the new Vite plugin (`@tailwindcss/vite`)
- **React 19** - Latest version with new features
- **oRPC** - Provides type-safe client-server communication
- **Hono** - Server framework
- **Vite 7** - Build tool with specific plugins configured
- **Zod** - Schema validation
- **shadcn/ui** - Pre-built accessible components

## Important Reminders

- **Main React entry point**: `./src/client/app.tsx`
- **File naming**: Use lowercase, dash-case (kebab-case) for filenames (e.g. `component-name.tsx`)
- **Chess components**: Located in `src/client/components/`
- **Game hooks**: Custom hooks in `src/client/hooks/`
- **Persistent Storage**: The `.storage/` directory is ignored by git and can be used for persistent data.

## RPC Structure

- **Server RPC entry**: `src/server/rpc/index.ts`
- **Available endpoints**:
  - `hello` - Basic hello functionality
  - `chess` - Chess game logic and AI moves
  - `ai.models` - AI model management and selection
- **Client RPC**: `src/client/rpc-client.ts`

## Key Components

- **Chess Board**: `src/client/components/chess-board.tsx`
- **Game Controls**: `src/client/components/game-controls.tsx`
- **Model Selector**: `src/client/components/model-selector.tsx`
- **Game Hooks**: `src/client/hooks/use-chess-game.ts`, `src/client/hooks/use-available-models.ts`

## Adding New Features

### UI Components

1. Use existing chess components as reference
2. Use shadcn/ui components from `src/client/components/ui/`
3. Add custom components to `src/client/components/`

### Server Functions

1. Add chess-related logic to `src/server/rpc/chess.ts`
2. Add AI model functionality to `src/server/rpc/models.ts`
3. Export new routers in `src/server/rpc/index.ts`
