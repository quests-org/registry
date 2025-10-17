import {
  SiNextdotjs,
  SiNuxtdotjs,
  SiSvelte,
  SiVite,
  SiTailwindcss,
  SiTypescript,
  SiHono,
  SiNodedotjs,
} from "react-icons/si";

const templates = [
  {
    name: "Next.js",
    icon: SiNextdotjs,
    color: "text-black dark:text-white",
    bgColor: "bg-white dark:bg-black",
  },
  {
    name: "Nuxt",
    icon: SiNuxtdotjs,
    color: "text-green-500 dark:text-green-400",
    bgColor: "bg-green-50 dark:bg-green-950/50",
  },
  {
    name: "Svelte",
    icon: SiSvelte,
    color: "text-orange-500 dark:text-orange-400",
    bgColor: "bg-orange-50 dark:bg-orange-950/50",
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
    name: "TypeScript",
    icon: SiTypescript,
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-50 dark:bg-blue-950/50",
  },
  {
    name: "Hono",
    icon: SiHono,
    color: "text-orange-500 dark:text-orange-400",
    bgColor: "bg-orange-50 dark:bg-orange-950/50",
  },
  {
    name: "Node.js",
    icon: SiNodedotjs,
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-50 dark:bg-green-950/50",
  },
];

export function TemplatesHero() {
  return (
    <div className="w-full h-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-neutral-950 dark:to-neutral-900 flex items-center justify-center relative overflow-hidden">
      {/* Logo Cloud Grid */}
      <div className="grid grid-cols-4 gap-20 w-full h-full p-16">
        {/* Row 1 */}
        <div className="flex justify-center items-center">
          <div className={`inline-flex items-center justify-center size-36 ${templates[0].bgColor} ${templates[0].color} rounded-2xl shadow-lg`}>
            {(() => {
              const IconComponent = templates[0].icon;
              return <IconComponent className="size-24" />;
            })()}
          </div>
        </div>
        <div className="flex justify-center items-center">
          <div className={`inline-flex items-center justify-center size-36 ${templates[1].bgColor} ${templates[1].color} rounded-2xl shadow-lg`}>
            {(() => {
              const IconComponent = templates[1].icon;
              return <IconComponent className="size-24" />;
            })()}
          </div>
        </div>
        <div className="flex justify-center items-center">
          <div className={`inline-flex items-center justify-center size-36 ${templates[2].bgColor} ${templates[2].color} rounded-2xl shadow-lg`}>
            {(() => {
              const IconComponent = templates[2].icon;
              return <IconComponent className="size-24" />;
            })()}
          </div>
        </div>
        <div className="flex justify-center items-center">
          <div className={`inline-flex items-center justify-center size-36 ${templates[3].bgColor} ${templates[3].color} rounded-2xl shadow-lg`}>
            {(() => {
              const IconComponent = templates[3].icon;
              return <IconComponent className="size-24" />;
            })()}
          </div>
        </div>

        {/* Row 2 */}
        <div className="flex justify-center items-center">
          <div className={`inline-flex items-center justify-center size-36 ${templates[4].bgColor} ${templates[4].color} rounded-2xl shadow-lg`}>
            {(() => {
              const IconComponent = templates[4].icon;
              return <IconComponent className="size-24" />;
            })()}
          </div>
        </div>
        <div className="flex justify-center items-center">
          <div className={`inline-flex items-center justify-center size-36 ${templates[5].bgColor} ${templates[5].color} rounded-2xl shadow-lg`}>
            {(() => {
              const IconComponent = templates[5].icon;
              return <IconComponent className="size-24" />;
            })()}
          </div>
        </div>
        <div className="flex justify-center items-center">
          <div className={`inline-flex items-center justify-center size-36 ${templates[6].bgColor} ${templates[6].color} rounded-2xl shadow-lg`}>
            {(() => {
              const IconComponent = templates[6].icon;
              return <IconComponent className="size-24" />;
            })()}
          </div>
        </div>
        <div className="flex justify-center items-center">
          <div className={`inline-flex items-center justify-center size-36 ${templates[7].bgColor} ${templates[7].color} rounded-2xl shadow-lg`}>
            {(() => {
              const IconComponent = templates[7].icon;
              return <IconComponent className="size-24" />;
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}
