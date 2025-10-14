import { fileRouter } from "@/server/rpc/file";
import { chat } from "@/server/rpc/chat";

export const router = {
  file: fileRouter,
  chat,
};
