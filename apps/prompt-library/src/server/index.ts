import { Hono } from "hono";

import { rpcApp } from "./routes/rpc";
import { clientEntry } from "./routes/client-entry";
import { chat } from "./routes/chat";

const app = new Hono();

app.route("/rpc", rpcApp);
app.post("/api/chat", chat);
app.get("/*", clientEntry);

export default app;
