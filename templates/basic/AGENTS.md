# Agent Guidelines for Basic Template

This is a foundational template for building React applications. Follow these guidelines to help users build apps effectively without breaking the established architecture.

## Template Architecture Overview

This template uses a **client-server architecture** with:

- **Frontend**: React 19 + Vite + Tailwind CSS 4
- **Backend**: Hono server with oRPC for type-safe APIs
- **Full-stack type safety** between client and server

## Critical Dependencies - DO NOT MODIFY

These dependencies are carefully configured and should **NOT** be changed:

- **Tailwind CSS v4** - Uses the new Vite plugin (`@tailwindcss/vite`)
- **React 19** - Latest version with new features
- **oRPC** - Provides type-safe client-server communication
- **Hono** - Server framework
- **Vite 7** - Build tool with specific plugins configured
- **Zod** - Schema validation (used by oRPC)

## Important Reminders

- **Tailwind CSS v4** syntax only (not v3)
- Use **RPC pattern** for all server communication
- **TanStack Query** is pre-configured
- **Read demo files first** for implementation patterns

## Understanding RPC

**When to use RPC**: Database operations, file I/O, external APIs, authentication, server-side validation.
**When NOT to use RPC**: UI state, form validation, client-side calculations, styling, component logic.

## Demo Files

Read these demo implementations to understand advanced functionality. Modify directly or learn from them:

- **`src/client/components/demo/rpc.tsx`** - Client RPC patterns: `useQuery`, `useMutation`, live updates
- **`src/server/rpc/demo/storage.ts`** - Server RPC handlers with key-value storage and live subscriptions
- **`src/server/lib/create-kv.ts`** - File-based storage utility with event publishing

## Adding New Features

### UI Components

1. Create in `src/client/components/` (organize by feature)
2. Use Tailwind CSS 4 syntax
3. Reference `demo/rpc.tsx` for RPC integration

### Server Functions

1. Add to `src/server/rpc/index.ts` router
2. Reference `demo/*` for patterns
3. Use `create-kv.ts` for simple storage
