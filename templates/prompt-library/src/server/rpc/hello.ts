import { os } from "@orpc/server";
import { z } from "zod";

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
};
