import devServer, { defaultOptions } from "@hono/vite-dev-server";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vite";
import { config } from "dotenv";

config();

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tsconfigPaths(),
    react(),
    tailwindcss(),
    devServer({
      // Exclude client folder from server because we only client render and
      // it interferes with image imports.
      exclude: [/src\/client\/.*/, ...defaultOptions.exclude],
      entry: "./src/server/index.ts",
    }),
  ],
});
