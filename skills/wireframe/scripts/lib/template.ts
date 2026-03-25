const TAILWIND_SCRIPT_SRC = `/_quests/assets/skills/wireframe/node_modules/@tailwindcss/browser/dist/index.global.js`;

const DEFAULT_BODY = `\
  <main class="max-w-5xl mx-auto px-6 py-12">
    <p>Replace this content with your wireframe.</p>
  </main>`;

export function buildHtml({ body, theme }: { body?: string; theme?: string }) {
  const bodyContent = body ?? DEFAULT_BODY;
  const themeContent = theme ? `\n${theme}` : "";
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Wireframe</title>
  <style type="text/tailwindcss">
@import "tailwindcss";

@theme {${themeContent}
}
  </style>
  <script src="${TAILWIND_SCRIPT_SRC}"></script>
</head>
<body>
${bodyContent}
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
