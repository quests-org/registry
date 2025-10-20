import devServer, { defaultOptions } from "@hono/vite-dev-server";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import path from "path";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    devServer({
      // Exclude client folder from server because we only client render and
      // it interferes with image imports.
      exclude: [/src\/client\/.*/, ...defaultOptions.exclude],
      entry: "./src/server/index.ts",
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
