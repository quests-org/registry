# Agent Guidelines for Prompt Library App

This app provides a prompt library interface for managing and organizing AI prompts. Follow these guidelines to help users extend the app effectively.

## App Architecture Overview

This app uses a **client-server architecture** with:

- **Primary language**: TypeScript
- **Frontend**: React 19 + Vite + Tailwind CSS 4 + shadcn/ui
- **Backend**: Hono server with oRPC for type-safe APIs
- **Storage**: Unstorage for data management
- **AI Integration**: AI SDK for prompt testing
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
- **AI SDK** - AI integration for prompt testing
- **Unstorage** - Storage abstraction
- **React Markdown** - Markdown rendering

## Important Reminders

- **Main React entry point**: `./src/client/app.tsx`
- **File naming**: Use lowercase, dash-case (kebab-case) for filenames (e.g. `component-name.tsx`)
- **Prompt Data**: Static data in `data/prompts.json`
- **Theme Support**: Dark/light mode toggle available
- **Persistent Storage**: The `.storage/` directory is ignored by git and can be used for persistent data.

## RPC Structure

- **Server RPC entry**: `src/server/rpc/index.ts`
- **Available endpoints**:
  - `hello` - Basic hello functionality
  - `prompts` - Prompt management and retrieval
  - `ai.models` - AI model management
- **Client RPC**: `src/client/rpc-client.ts`

## Key Features

- **Prompt Management**: Browse, search, and organize prompts
- **Data Storage**: JSON-based prompt data in `data/prompts.json`
- **Theme Toggle**: Built-in dark/light mode support

## Adding New Features

### UI Components

1. Use shadcn/ui components from `src/client/components/ui/`
2. Add custom components to `src/client/components/`
3. Reference existing theme toggle patterns

### Server Functions

1. Add prompt logic to `src/server/rpc/prompts.ts`
2. Add AI model functionality to `src/server/rpc/models.ts`
3. Export new routers in `src/server/rpc/index.ts`
