import { useEffect } from "react";
import {
  SiReact,
  SiTypescript,
  SiVite,
  SiTailwindcss,
  SiHono,
  SiZod,
  SiOpenai,
} from "react-icons/si";
import { FaCode, FaDatabase, FaCog } from "react-icons/fa";
import { QuestsLogoIcon } from "./quest-logo";

const dependencies = [
  {
    name: "React",
    description: "Frontend component framework",
    icon: SiReact,
    color: "text-blue-500 dark:text-blue-400",
    bgColor: "bg-blue-50 dark:bg-blue-950/50",
  },
  {
    name: "TypeScript",
    description: "Type-safe JavaScript",
    icon: SiTypescript,
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-50 dark:bg-blue-950/50",
  },
  {
    name: "Vite",
    description: "Modern build tool & dev server",
    icon: SiVite,
    color: "text-purple-500 dark:text-purple-400",
    bgColor: "bg-purple-50 dark:bg-purple-950/50",
  },
  {
    name: "Tailwind CSS",
    description: "Utility-first CSS framework",
    icon: SiTailwindcss,
    color: "text-cyan-500 dark:text-cyan-400",
    bgColor: "bg-cyan-50 dark:bg-cyan-950/50",
  },
  {
    name: "Hono",
    description: "Lightweight web framework",
    icon: SiHono,
    color: "text-orange-500 dark:text-orange-400",
    bgColor: "bg-orange-50 dark:bg-orange-950/50",
  },
  {
    name: "oRPC",
    description: "Type-safe RPC framework",
    icon: FaCode,
    color: "text-green-500 dark:text-green-400",
    bgColor: "bg-green-50 dark:bg-green-950/50",
  },
  {
    name: "Zod",
    description: "TypeScript schema validation",
    icon: SiZod,
    color: "text-indigo-500 dark:text-indigo-400",
    bgColor: "bg-indigo-50 dark:bg-indigo-950/50",
  },
  {
    name: "OpenAI",
    description: "AI integration ready",
    icon: SiOpenai,
    color: "text-emerald-500 dark:text-emerald-400",
    bgColor: "bg-emerald-50 dark:bg-emerald-950/50",
  },
  {
    name: "Unstorage",
    description: "Universal storage layer",
    icon: FaDatabase,
    color: "text-pink-500 dark:text-pink-400",
    bgColor: "bg-pink-50 dark:bg-pink-950/50",
  },
];

const features = [
  {
    icon: FaDatabase,
    title: "Full-Stack Ready",
    description: "Build complete applications with frontend and backend APIs",
  },
  {
    icon: FaCode,
    title: "Type-Safe",
    description: "End-to-end type safety with TypeScript and oRPC",
  },
  {
    icon: FaCog,
    title: "AI Integration",
    description: "Built-in OpenAI integration for AI-powered features",
  },
];

export function GettingStarted() {
  useEffect(() => {
    // Set up system theme detection
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };

    // Set initial theme
    if (mediaQuery.matches) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Listen for changes
    mediaQuery.addEventListener('change', handleChange);

    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900">
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center mb-4">
            <QuestsLogoIcon className="size-16" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Quests Starter Template
          </h1>
        </div>

        {/* Getting Started Section */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg dark:shadow-gray-950/20 p-8 mb-4 border dark:border-gray-800">
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Quick Start</h3>
              <div className="space-y-2 text-gray-700 dark:text-gray-300">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 size-6 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-sm font-medium">1</div>
                  <div>
                    Get started instantly using the <a
                      href="https://quest.dev"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium underline"
                    >
                      Quests app
                    </a>
                  </div>
                </div>
                <div className="text-left text-xs text-gray-400 dark:text-gray-500 ml-9">or</div>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 size-6 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-sm font-medium">2</div>
                  <div>
                    Run the app directly with <code className="bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-2 py-1 rounded text-sm">pnpm dev</code>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Key Features</h3>
              <div className="space-y-4">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="flex-shrink-0 size-8 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-lg flex items-center justify-center">
                      <feature.icon className="size-4" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">{feature.title}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Dependencies Row */}
          <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-800">
            <div className="flex flex-wrap justify-center items-center gap-6">
              {dependencies.map((dep, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className={`inline-flex items-center justify-center size-8 ${dep.bgColor} ${dep.color} rounded-lg`}>
                    <dep.icon className="size-4" />
                  </div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{dep.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>


        {/* Footer */}
        <div className="text-center mt-16">
          <p className="text-gray-500 dark:text-gray-400">
            Source code on <a
              href="https://github.com/quests-org/registry/tree/main/templates/basic"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium underline"
            >
              GitHub
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
