export default {
  versionGroups: [
    {
      dependencies: ["@tanstack/react-query"],
      pinVersion: "^5.85.5",
    },
    {
      dependencies: ["@orpc/client", "@orpc/server"],
      pinVersion: "^1.8.3",
    },
    {
      dependencies: ["@types/node"],
      pinVersion: "^22",
    },
    {
      // Allow Zod 3 and 4 due to OpenAI's SDK requiring 3 for now
      dependencies: ["zod"],
      isIgnored: true,
    },
  ],
} satisfies import("syncpack").RcFile;
