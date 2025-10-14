# Agent Guidelines for Typing Test App

This app provides a simple typing test interface. Follow these guidelines to help users extend the app effectively.

## App Architecture Overview

This app uses a **client-server architecture** with:

- **Primary language**: TypeScript
- **Frontend**: React 19 + Vite + Tailwind CSS 4
- **Backend**: Hono server (minimal setup)
- **Simple Structure**: No RPC, focused on typing test functionality

## Critical Dependencies - DO NOT MODIFY

These dependencies are carefully configured and should **NOT** be changed:

- **Tailwind CSS v4** - Uses the new Vite plugin (`@tailwindcss/vite`)
- **React 19** - Latest version with new features
- **Hono** - Server framework
- **Vite 7** - Build tool with specific plugins configured

## Important Reminders

- **Main React entry point**: `./src/client/app.tsx`
- **File naming**: Use lowercase, dash-case (kebab-case) for filenames (e.g. `component-name.tsx`)
- **Minimal Structure**: Simple client-only functionality with basic server
- **Persistent Storage**: The `.storage/` directory is ignored by git and can be used for persistent data.

## App Structure

- **Client Entry**: `src/client/app.tsx`
- **Server Entry**: `src/server/index.ts`
- **Styles**: `src/client/styles/globals.css`
- **No RPC**: Direct client-side implementation

## Adding New Features

### UI Components

1. Add components directly to `src/client/`
2. Use Tailwind CSS for styling
3. Focus on typing test functionality

### Server Functions

1. Extend `src/server/index.ts` for any server needs
2. Keep minimal server footprint
3. Add routes to `src/server/routes/` if needed
