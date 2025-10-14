/** @jsxImportSource hono/jsx */
import { Context } from "hono";
import viteReact from "@vitejs/plugin-react";

import { BlankEnv } from "hono/types";

export function clientEntry(c: Context<BlankEnv>) {
  return c.html(
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta content="width=device-width, initial-scale=1" name="viewport" />
        <title>Chat with Files</title>
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png" />
        <link rel="icon" type="image/png" sizes="48x48" href="/favicon-48.png" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#00a63e" />
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
