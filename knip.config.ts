import type { KnipConfig } from "knip";

const DEFAULT_ENTRY = [
  "src/server/index.ts",
  "src/client/main.tsx",
  "src/client/components/ui/*",
  "src/client/components/ai-elements/*",
  "src/client/components/*",
  "src/client/lib/utils.ts",
  "src/app/page.tsx",
  "src/app/layout.tsx",
  "src/client/components/demo/*.tsx",
  "src/lib/index.ts",
  "src/app.css",
  "src/app.tsx",
  "app.config.ts",
  "src/entry-client.tsx",
  "src/entry-server.tsx",
  "src/routes/*",
  "scripts/*",
];

const config: KnipConfig = {
  workspaces: {
    "templates/*": {
      entry: DEFAULT_ENTRY,
    },
    "tools/*": {
      entry: DEFAULT_ENTRY,
    },
    "templates/nuxt": {
      entry: [...DEFAULT_ENTRY, "app/app.vue"],
    },
    "templates/angular": {
      entry: [...DEFAULT_ENTRY, "src/app/app.css", "src/styles.css"],
    },
    "templates/htmx": {
      entry: [...DEFAULT_ENTRY, "public/htmx.min.js", "public/styles.css"],
    },
  },
  ignore: ["blocks/**"],
  ignoreDependencies: [
    "jscodeshift",
    "eslint-config-next",
    "postcss",
    "vue",
    "vue-router",
    "@angular/forms",
    "@solidjs/meta",
    "@solidjs/router",
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
