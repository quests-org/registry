import { Hono } from "hono";

import { clientEntry } from "./routes/client-entry";

const app = new Hono();

app.get("/*", clientEntry);

export default app;
