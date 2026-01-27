import { onError } from "@orpc/server";
import { RPCHandler } from "@orpc/server/fetch";
import { CORSPlugin } from "@orpc/server/plugins";

import { router } from "@/server/rpc";
import { Hono } from "hono";

export const rpcApp = new Hono();

const handler = new RPCHandler(router, {
  interceptors: [
    onError((error) => {
      console.error(error);
    }),
  ],
  plugins: [new CORSPlugin()],
});

rpcApp.use("/*", async (c, next) => {
  const { matched, response } = await handler.handle(c.req.raw, {
    prefix: "/rpc",
  });

  if (matched) {
    return c.newResponse(response.body, response);
  }

  await next();
  return;
});
