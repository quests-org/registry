import { router as helloRouter } from "./hello";
import { router as promptsRouter } from "./prompts";

import { models } from "@/server/rpc/models";

export const router = {
  hello: helloRouter,
  prompts: promptsRouter,

  ai: {
    models,
  },
};
