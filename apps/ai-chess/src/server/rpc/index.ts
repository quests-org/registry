import { router as helloRouter } from "./hello";
import { chess } from "./chess";
import { models } from "@/server/rpc/models";

export const router = {
  hello: helloRouter,
  chess,
  ai: {
    models,
  },
};
