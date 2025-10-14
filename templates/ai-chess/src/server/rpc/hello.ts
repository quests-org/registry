import { os } from "@orpc/server";
import { z } from "zod";

import { models } from "@/server/rpc/models";

const sayHello = os
  .input(
    z.object({
      name: z.string().min(1, "Name is required"),
    }),
  )
  .handler(async ({ input }) => {
    return `Welcome to ${input.name}`;
  });

export const router = {
  sayHello,

  ai: {
    models
  }
};
