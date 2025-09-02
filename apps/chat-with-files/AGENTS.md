# Agent Guidelines for Chat with Files App

This app enables chat functionality with file upload and processing capabilities. Follow these guidelines to help users extend the app effectively.

## App Architecture Overview

This app uses a **client-server architecture** with:

- **Primary language**: TypeScript
- **Frontend**: React 19 + Vite + Tailwind CSS 4
- **Backend**: Hono server with oRPC for type-safe APIs
- **Storage**: Unstorage for file handling
- **AI Integration**: AI SDK for chat functionality
- **Full-stack type safety** between client and server

## Critical Dependencies - DO NOT MODIFY

These dependencies are carefully configured and should **NOT** be changed:

- **Tailwind CSS v4** - Uses the new Vite plugin (`@tailwindcss/vite`)
- **React 19** - Latest version with new features
- **oRPC** - Provides type-safe client-server communication
- **Hono** - Server framework
- **Vite 7** - Build tool with specific plugins configured
- **AI SDK** - AI integration for chat functionality
- **Unstorage** - File storage abstraction

## Important Reminders

- **Main React entry point**: `./src/client/app.tsx`
- **File naming**: Use lowercase, dash-case (kebab-case) for filenames (e.g. `component-name.tsx`)
- **Minimal UI**: Focused on file upload and chat functionality
- **Persistent Storage**: The `.storage/` directory is ignored by git and can be used for persistent data.

## RPC Structure

- **Server RPC entry**: `src/server/rpc/index.ts`
- **Available endpoints**:
  - `file` - File upload and processing functionality
  - `chat` - Chat operations with file context
- **Client RPC**: `src/client/rpc-client.ts`

## Key Features

- **File Upload**: Handle various document formats
- **Chat Interface**: Chat with uploaded file contents
- **File Processing**: Server-side document parsing

## Adding New Features

### UI Components

1. Add components to `src/client/` (minimal structure)
2. Use Tailwind CSS for styling
3. Focus on file and chat interactions

### Server Functions

1. Add file processing logic to `src/server/rpc/file.ts`
2. Add chat functionality to `src/server/rpc/chat.ts`
3. Export new routers in `src/server/rpc/index.ts`
