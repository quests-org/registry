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
  ],
} satisfies import("syncpack").RcFile;
