# Agent Guidelines for shadcn Template

This template extends the basic template with shadcn/ui components. Follow these guidelines to help users build apps effectively without breaking the established architecture.

## Template Architecture Overview

This template uses a **client-server architecture** with:

- **Primary language**: TypeScript
- **Frontend**: React 19 + Vite + Tailwind CSS 4 + shadcn/ui
- **Backend**: Hono server with oRPC for type-safe APIs
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
- **UI Components**: Use shadcn/ui components from `src/client/components/ui/`
- **Theming**: Theme provider is configured in `src/client/components/theme-provider.tsx`
- **Persistent Storage**: The `.storage/` directory is ignored by git and can be used for persistent data.

## RPC Structure

- **Server RPC entry**: `src/server/rpc/index.ts`
- **Available endpoints**:
  - `hello` - Basic hello functionality
- **Client RPC**: `src/client/rpc-client.ts`

## Adding New Features

### UI Components

1. Use existing shadcn/ui components from `src/client/components/ui/`
2. Add custom components to `src/client/components/`
3. Use Tailwind CSS for styling

### Server Functions

1. Add new RPC routers to `src/server/rpc/`
2. Export them in `src/server/rpc/index.ts`
3. Follow oRPC patterns for type safety
