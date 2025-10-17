import { BrowserRouter, useRoutes, Link } from "react-router-dom";
import { GettingStarted } from "./components/getting-started";
import { GettingStarted as BasicHero } from "./components/basic-hero";
import { GettingStarted as ShadcnHero } from "./components/shadcn-hero";
import { SvelteKitHero } from "@/client/components/svelte-kit-hero";
import { AppsHero } from "@/client/components/apps-hero";
import { TemplatesHero } from "@/client/components/templates-hero";

const routeConfig = [
  { path: "/templates/basic/getting-started", name: "Basic: Getting Started", element: <GettingStarted /> },
  { path: "/templates/basic", name: "Template: Basic", element: <BasicHero /> },
  { path: "/templates/shadcn", name: "Template: shadcn/ui", element: <ShadcnHero /> },
  { path: "/templates/svelte-kit", name: "Template: SvelteKit", element: <SvelteKitHero /> },
  { path: "/apps", name: "Apps Hero", element: <AppsHero /> },
  { path: "/templates", name: "Templates Hero", element: <TemplatesHero /> },
];

function RootPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
      <div className="text-left">
        <pre className="font-mono text-sm">
          <div className="text-lg font-bold mb-2 dark:text-white">Hero Images</div>
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-6">
            Open DevTools on a given page to take a node screenshot.<br />Right click element → "Capture Node Screenshot".
          </div>
          {routeConfig.map((route) => (
            <div key={route.path}>
              <Link to={route.path} className="text-blue-600 hover:underline">
                {route.path}
              </Link>
              {" - "}
              <span className="text-gray-600 dark:text-gray-400">{route.name}</span>
            </div>
          ))}
        </pre>
      </div>
    </div>
  );
}

function AppRoutes() {
  const routes = useRoutes([
    { path: "/", element: <RootPage /> },
    ...routeConfig.map(({ path, element }) => ({ path, element })),
  ]);
  return routes;
}

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;
