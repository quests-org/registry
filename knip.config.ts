import type { KnipConfig } from "knip";

const config: KnipConfig = {
  workspaces: {
    "templates/basic": {
      entry: [
        "src/server/index.ts",
        "src/client/main.tsx",
        "src/client/components/demo/*.tsx",
      ],
    },
    "templates/shadcn": {
      entry: [
        "src/server/index.ts",
        "src/client/main.tsx",
        "src/client/components/ui/*",
        "src/client/components/theme-provider.tsx",
        "src/client/lib/utils.ts",
      ],
    },
    "templates/solid": {
      entry: [
        "app.config.ts",
        "src/app.tsx",
        "src/entry-client.tsx",
        "src/entry-server.tsx",
        "src/routes/**/*.tsx",
      ],
    },
    "templates/nuxt": {
      entry: ["app/app.vue"],
    },
    "templates/angular": {
      entry: ["src/app/app.css", "src/styles.css"],
    },
    "templates/htmx": {
      entry: ["public/htmx.min.js", "public/styles.css", "public/index.html"],
    },
    "templates/svelte-kit": {
      entry: ["src/lib/index.ts", "src/app.css"],
    },
    "templates/nextjs": {
      entry: ["src/app/**/*.tsx"],
    },
    "templates/astro": {
      entry: ["src/**/*.astro"],
    },
    "tools/hero-images": {
      entry: [
        "src/server/index.ts",
        "src/client/main.tsx",
        "src/client/components/*",
      ],
    },
  },
  ignoreDependencies: [
    "jscodeshift",
    "eslint-config-next",
    "postcss",
    "vue",
    "vue-router",
    "@angular/forms",
  ],
  compilers: {
    css: (text: string) =>
      [...text.matchAll(/(?<=@)(import|plugin)[^;]+/g)]
        .join("\n")
        .replace("plugin", "import"),
  },
  treatConfigHintsAsErrors: false,
};

export default config;
