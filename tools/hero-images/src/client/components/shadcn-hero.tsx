import {
  SiReact,
  SiTypescript,
  SiVite,
  SiTailwindcss,
  SiHono,
  SiZod,
  SiOpenai,
  SiShadcnui
} from "react-icons/si";
import { FaCode, FaDatabase } from "react-icons/fa";

const dependencies = [
  {
    name: "React",
    icon: SiReact,
    color: "text-blue-500 dark:text-blue-400",
    bgColor: "bg-blue-50 dark:bg-blue-950/50",
  },
  {
    name: "TypeScript",
    icon: SiTypescript,
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-50 dark:bg-blue-950/50",
  },
  {
    name: "Vite",
    icon: SiVite,
    color: "text-purple-500 dark:text-purple-400",
    bgColor: "bg-purple-50 dark:bg-purple-950/50",
  },
  {
    name: "Tailwind CSS",
    icon: SiTailwindcss,
    color: "text-cyan-500 dark:text-cyan-400",
    bgColor: "bg-cyan-50 dark:bg-cyan-950/50",
  },
  {
    name: "Hono",
    icon: SiHono,
    color: "text-orange-500 dark:text-orange-400",
    bgColor: "bg-orange-50 dark:bg-orange-950/50",
  },
  {
    name: "oRPC",
    icon: FaCode,
    color: "text-green-500 dark:text-green-400",
    bgColor: "bg-green-50 dark:bg-green-950/50",
  },
  {
    name: "Zod",
    icon: SiZod,
    color: "text-indigo-500 dark:text-indigo-400",
    bgColor: "bg-indigo-50 dark:bg-indigo-950/50",
  },
  {
    name: "OpenAI",
    icon: SiOpenai,
    color: "text-emerald-500 dark:text-emerald-400",
    bgColor: "bg-emerald-50 dark:bg-emerald-950/50",
  },
  {
    name: "Unstorage",
    icon: FaDatabase,
    color: "text-pink-500 dark:text-pink-400",
    bgColor: "bg-pink-50 dark:bg-pink-950/50",
  },
];

export function GettingStarted() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center">
        {/* Header */}
        <div className="mb-16">
          <div className="inline-flex items-center justify-center mb-4">
            <SiShadcnui className="size-20 text-white mb-4" />
          </div>
          <h1 className="text-6xl font-bold text-white mb-4">
            shadcn/ui Starter Template
          </h1>
        </div>

        {/* Dependencies Row */}
        <div className="flex flex-wrap justify-center items-center gap-6 max-w-5xl mx-auto">
          {dependencies.map((dep, index) => (
            <div key={index} className="flex items-center gap-3">
              <div className={`inline-flex items-center justify-center size-16 ${dep.bgColor} ${dep.color} rounded-xl`}>
                <dep.icon className="size-8" />
              </div>
              <span className="text-lg font-medium text-gray-700 dark:text-gray-300">{dep.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
