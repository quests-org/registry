export default {
  versionGroups: [
    {
      dependencies: ["@tanstack/react-query"],
      pinVersion: "^5.85.5",
    },
    {
      dependencies: ["@orpc/client", "@orpc/server"],
      pinVersion: "^1.8.8",
    },
    {
      dependencies: ["@types/node"],
      pinVersion: "22.19.2",
    },
    {
      dependencies: ["lucide-react"],
      pinVersion: "^0.546.0",
    },
  ],
} satisfies import("syncpack").RcFile;
