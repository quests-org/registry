import type { KnipConfig } from "knip";

const config: KnipConfig = {
  workspaces: {
    "templates/*": {
      entry: ["src/server/index.ts", "src/client/main.tsx"],
    },
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
        "src/client/components/*",
      ],
    },
    "apps/*": {
      entry: [
        "src/server/index.ts",
        "src/client/main.tsx",
        "src/client/components/ui/*",
        "src/client/components/ai-elements/*",
        "src/client/lib/utils.ts",
      ],
    },
  },
  ignore: ["blocks/**"],
  ignoreDependencies: ["jscodeshift"],
  compilers: {
    css: (text: string) =>
      [...text.matchAll(/(?<=@)(import|plugin)[^;]+/g)]
        .join("\n")
        .replace("plugin", "import"),
  },
  treatConfigHintsAsErrors: false,
};

export default config;
