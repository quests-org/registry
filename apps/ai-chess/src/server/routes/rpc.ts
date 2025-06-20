import { RPCHandler } from "@orpc/server/fetch";

import { router } from "../rpc";
import { Hono } from "hono";

export const rpcApp = new Hono();

const handler = new RPCHandler(router);

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
