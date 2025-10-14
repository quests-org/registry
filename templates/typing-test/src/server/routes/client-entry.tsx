/** @jsxImportSource hono/jsx */
import type { Context } from "hono";
import viteReact from "@vitejs/plugin-react";

import type { BlankEnv } from "hono/types";

export function clientEntry(c: Context<BlankEnv>) {
  return c.html(
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta content="width=device-width, initial-scale=1" name="viewport" />
        <title>New Quest</title>
        {import.meta.env.PROD ? (
          <script src="/static/main.js" type="module" />
        ) : (
          <>
            <script
              dangerouslySetInnerHTML={{
                __html: viteReact.preambleCode.replace("__BASE__", "/"),
              }}
              type="module"
            />
            <script src="/src/client/main.tsx" type="module" />
          </>
        )}
      </head>
      <body>
        <div id="root" />
      </body>
    </html>,
  );
}
