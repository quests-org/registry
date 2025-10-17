import {
  SiAngular,
  SiAstro,
  SiNextdotjs,
  SiNuxtdotjs,
  SiReact,
  SiSolid,
  SiSvelte,
  SiVuedotjs,
} from "react-icons/si";

const templates = [
  {
    name: "React",
    icon: SiReact,
    color: "text-blue-500 dark:text-blue-400",
    bgColor: "bg-blue-50 dark:bg-blue-950/50",
  },
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
    name: "Angular",
    icon: SiAngular,
    color: "text-red-500 dark:text-red-400",
    bgColor: "bg-red-50 dark:bg-red-950/50",
  },
  {
    name: "Astro",
    icon: SiAstro,
    color: "text-orange-500 dark:text-orange-400",
    bgColor: "bg-orange-50 dark:bg-orange-950/50",
  },
  {
    name: "Solid",
    icon: SiSolid,
    color: "text-blue-500 dark:text-blue-400",
    bgColor: "bg-blue-50 dark:bg-blue-950/50",
  },
  {
    name: "SvelteKit",
    icon: SiSvelte,
    color: "text-red-500 dark:text-red-400",
    bgColor: "bg-red-50 dark:bg-red-950/50",
  },
  {
    name: "Vue",
    icon: SiVuedotjs,
    color: "text-green-500 dark:text-green-400",
    bgColor: "bg-green-50 dark:bg-green-950/50",
  },
];

export function TemplatesHero() {
  return (
    <div className="w-full h-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-neutral-950 dark:to-neutral-900 flex items-center justify-center relative overflow-hidden">
      {/* Logo Cloud Grid */}
      <div className="grid grid-cols-4 gap-16 w-full h-full p-12">
        {templates.map((template) => (
          <div key={template.name} className="flex justify-center items-center">
            <div className={`inline-flex items-center justify-center size-32 ${template.bgColor} ${template.color} rounded-2xl shadow-lg`}>
              {(() => {
                const IconComponent = template.icon;
                return <IconComponent className="size-20" />;
              })()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
