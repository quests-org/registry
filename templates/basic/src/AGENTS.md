# Agent Guidelines for Basic Template

This is a foundational template for building interactive React applications.

## Template Architecture Overview

This template uses a client-server architecture with:

- Primary language: TypeScript
- Frontend: React 19 + Vite + Tailwind CSS 4
- Backend: Hono server with oRPC for type-safe APIs
- Full-stack type safety between client and server

## Critical Dependencies - DO NOT MODIFY

These dependencies are carefully configured and should NOT be changed:

- Tailwind CSS v4 - Uses the new Vite plugin (`@tailwindcss/vite`)
- React 19 - Latest version with new features
- oRPC - Provides type-safe client-server communication
- Hono - Server framework
- Vite 7 - Build tool with specific plugins configured
- Zod - Schema validation

## Important Reminders

- Main React entry point: `src/client/app.tsx`
- File naming: Use lowercase, dash-case (kebab-case) for filenames (e.g. `component-name.tsx`)
- Flexbox layouts: Avoid centering containers that constrain component width in `app.tsx`
- Key-Value Storage: Use `unstorage` for persistent key-value data (see demo files). Data is stored in `.storage/` directory which is gitignored.

## Demo Files - Reference Implementations

These files provide working examples for common functionality. Use them as templates or reference when implementing similar features:

> [!IMPORTANT] ALWAYS read these demo files first - Do not guess implementation based on file names.

### Client Patterns

- `src/client/components/demo/rpc.tsx` - RPC demo that uses `server/rpc/demo/storage.ts`
- `src/client/components/demo/ai.tsx` - AI mutations using response data directly (no manual state)

### Server Patterns

- `src/server/rpc/demo/storage.ts` - key-value storage with live subscriptions
- `src/server/rpc/demo/ai.ts` - AI chat completion and structured generation
- `src/server/lib/create-kv.ts` - Simple storage setup for oRPC handlers

## Adding New Features

- **Do NOT create new files in demo folders** - Demo files are reference implementations only

### UI Components

1. Create in `src/client/components/` (organize by feature)
2. Use Tailwind CSS
3. Reference `demo/rpc.tsx` for RPC integration

### Server Functions

1. Add to `src/server/rpc/index.ts` router
2. Reference `demo/*` for patterns
3. Use `create-kv.ts` for simple storage
