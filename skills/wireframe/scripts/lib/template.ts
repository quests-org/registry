const TAILWIND_SCRIPT_SRC =
  "/_quests/assets/skills/wireframe/node_modules/@tailwindcss/browser/dist/index.global.js";

export function buildHtml({ title }: { title: string }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
  <style type="text/tailwindcss">
@import "tailwindcss";

@theme {
}
  </style>
  <script src="${TAILWIND_SCRIPT_SRC}"></script>
</head>
<body>
  <main class="max-w-5xl mx-auto px-6 py-12">
    <h1 class="text-3xl font-bold mb-4">${escapeHtml(title)}</h1>
    <p>Replace this content with your wireframe.</p>
  </main>
</body>
</html>
`;
}

function escapeHtml(str: string) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
