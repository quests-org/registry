# Agent Guidelines for Micro Chatbot App

This app provides a micro chatbot interface with AI elements and conversation features. Follow these guidelines to help users extend the app effectively.

## App Architecture Overview

This app uses a **client-server architecture** with:

- **Primary language**: TypeScript
- **Frontend**: React 19 + Vite + Tailwind CSS 4 + shadcn/ui
- **Backend**: Hono server with oRPC for type-safe APIs
- **AI Integration**: AI SDK with rich AI elements
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
- **AI SDK** - AI integration with React hooks
- **Streamdown** - Markdown streaming

## Important Reminders

- **Main React entry point**: `./src/client/app.tsx`
- **File naming**: Use lowercase, dash-case (kebab-case) for filenames (e.g. `component-name.tsx`)
- **AI Elements**: Rich components in `src/client/components/ai-elements/`
- **Chat Interface**: Main chat component in `src/client/components/chat.tsx`
- **Persistent Storage**: The `.storage/` directory is ignored by git and can be used for persistent data.

## RPC Structure

- **Server RPC entry**: `src/server/rpc/index.ts`
- **Available endpoints**:
  - `chat` - Chat functionality and conversation management
  - `ai.models` - AI model management and selection
- **Client RPC**: `src/client/rpc-client.ts`

## Key Components

- **AI Elements**: Rich interactive components in `src/client/components/ai-elements/`
- **Chat Interface**: `src/client/components/chat.tsx`
- **Theme Provider**: `src/client/components/theme-provider.tsx`

- **Persistent Storage**: The `.storage/` directory is ignored by git and can be used for persistent data.

## Adding New Features

### UI Components

1. Use AI elements from `src/client/components/ai-elements/`
2. Use shadcn/ui components from `src/client/components/ui/`
3. Add custom components to `src/client/components/`

### Server Functions

1. Add chat logic to `src/server/rpc/chat.ts`
2. Add AI model functionality to `src/server/rpc/models.ts`
3. Export new routers in `src/server/rpc/index.ts`
