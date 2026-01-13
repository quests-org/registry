import { Hono } from "hono";
import { serveStatic } from "@hono/node-server/serve-static";

import { rpcApp } from "./routes/rpc";
import { clientEntry } from "./routes/client-entry";

const app = new Hono();

app.route("/rpc", rpcApp);
app.use("/input/*", serveStatic({ root: "./" }));
app.use("/output/*", serveStatic({ root: "./" }));
app.get("/*", clientEntry);

export default app;
