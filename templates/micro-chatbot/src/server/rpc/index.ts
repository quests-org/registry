import { chat } from "@/server/rpc/chat";
import { models } from "@/server/rpc/models";

export const router = {
  chat,
  ai: {
    models,
  },
};
