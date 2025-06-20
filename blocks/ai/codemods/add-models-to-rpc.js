/**
 * Codemod to add models import and ai.models to RPC router
 *
 * This transform:
 * 1. Adds import for models from @/server/rpc/models
 * 2. Adds ai.models to the router export
 *
 * Usage: jscodeshift -t add-models-to-rpc.js src/server/rpc/index.ts
 */

const { execSync } = require("child_process");

module.exports = function transformer(fileInfo, api) {
  const j = api.jscodeshift;
  const root = j(fileInfo.source);

  // Check if this is an RPC index file by looking for router export
  const routerExports = root.find(j.ExportNamedDeclaration, {
    declaration: {
      type: "VariableDeclaration",
      declarations: [
        {
          id: { name: "router" },
        },
      ],
    },
  });

  if (routerExports.length === 0) {
    // No router export found, skip this file
    return fileInfo.source;
  }

  // Check if models import already exists
  const modelsImports = root.find(j.ImportDeclaration, {
    source: { value: "@/server/rpc/models" },
  });

  if (modelsImports.length > 0) {
    // Models import already exists, skip
    return fileInfo.source;
  }

  // Add models import
  const lastImport = root.find(j.ImportDeclaration).at(-1);

  if (lastImport.length > 0) {
    lastImport.insertAfter(
      j.importDeclaration(
        [j.importSpecifier(j.identifier("models"))],
        j.literal("@/server/rpc/models")
      )
    );
  } else {
    // No imports exist, add at the top
    root
      .get()
      .node.body.unshift(
        j.importDeclaration(
          [j.importSpecifier(j.identifier("models"))],
          j.literal("@/server/rpc/models")
        )
      );
  }

  // Find the router object and add ai.models
  const routerDeclaration = root.find(j.VariableDeclarator, {
    id: { name: "router" },
  });

  routerDeclaration.forEach((path) => {
    const routerObject = path.value.init;

    if (routerObject && routerObject.type === "ObjectExpression") {
      // Check if ai property already exists
      const aiProperty = routerObject.properties.find(
        (prop) => prop.key && prop.key.name === "ai"
      );

      if (aiProperty) {
        // ai property exists, check if it has models
        if (aiProperty.value && aiProperty.value.type === "ObjectExpression") {
          const hasModels = aiProperty.value.properties.find(
            (prop) => prop.key && prop.key.name === "models"
          );

          if (!hasModels) {
            // Add models to existing ai object
            aiProperty.value.properties.push(
              j.property("init", j.identifier("models"), j.identifier("models"))
            );
            aiProperty.value.properties[
              aiProperty.value.properties.length - 1
            ].shorthand = true;
          }
        }
      } else {
        // Add new ai property with models
        routerObject.properties.push(
          j.property(
            "init",
            j.identifier("ai"),
            j.objectExpression([
              j.property(
                "init",
                j.identifier("models"),
                j.identifier("models")
              ),
            ])
          )
        );
        // Set shorthand for models property
        const aiProp =
          routerObject.properties[routerObject.properties.length - 1];
        aiProp.value.properties[0].shorthand = true;
      }
    }
  });

  return root.toSource({
    quote: "double",
    reuseParsers: true,
  });
};
