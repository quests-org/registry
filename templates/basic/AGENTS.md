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

## Understanding RPC

**When to use RPC**: Database operations, file I/O, external APIs, authentication, server-side validation.
**When NOT to use RPC**: UI state, form validation, client-side calculations, styling, component logic.

## Adding New Features

### For UI Components

1. Create components in `src/client/components/` (organize by feature)
2. Use Tailwind CSS 4 syntax for styling
3. Import and use in `app.tsx` or other components

### For Server Functionality

Add new RPC functions directly to `src/server/rpc/main.ts` by expanding the router object.

**Note**: The `.storage/` folder is gitignored for local data persistence.

### Example: Adding Data Storage

```typescript
// src/server/rpc/main.ts - Add to existing router
import fs from "node:fs/promises";
import { join } from "path";
import { EventPublisher } from "@orpc/server";

const STORAGE_DIR = ".storage";
const ITEMS_FILE = join(STORAGE_DIR, "items.json");

const publisher = new EventPublisher<{
  "items-updated": { items: any[] };
}>();

async function loadItems() {
  await fs.mkdir(STORAGE_DIR, { recursive: true });
  try {
    const data = await fs.readFile(ITEMS_FILE, "utf8");
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function saveItems(items: any[]) {
  await fs.writeFile(ITEMS_FILE, JSON.stringify(items, null, 2));
  publisher.publish("items-updated", { items });
}

const addItem = os
  .input(z.object({ name: z.string() }))
  .handler(async ({ input }) => {
    const items = await loadItems();
    const item = { id: Date.now().toString(), name: input.name };
    items.push(item);
    await saveItems(items);
    return item;
  });

const liveItems = os.handler(async function* ({ signal }) {
  yield await loadItems();
  for await (const { items } of publisher.subscribe("items-updated", {
    signal,
  })) {
    yield items;
  }
});

export const router = {
  hello, // existing
  addItem,
  liveItems,
};
```

```typescript
// Client usage - Live updates
const { data } = useQuery(
  queryClient.main.liveItems.experimental_liveOptions()
);
const addMutation = useMutation({
  mutationFn: queryClient.main.addItem.mutationFn,
});
```

## Important Reminders

- **Tailwind CSS v4** syntax only (not v3)
- Use **RPC pattern** for all server communication
- **TanStack Query** is pre-configured - use `useQuery`/`useMutation`
- Don't modify core config files unless absolutely necessary
- Check the existing `main` RPC function as a working reference
- The `main` RPC function provides a generic starting point - modify or replace as needed

## Quick Start

1. Add React components in `src/client/components/`
2. Add RPC functions to `src/server/rpc/main.ts` router
3. Use `queryClient.main.yourFunction` in components to call RPC functions
4. Use `experimental_liveOptions()` for real-time updates
