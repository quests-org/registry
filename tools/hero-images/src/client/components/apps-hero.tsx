import {
  LuCrown,
  LuFolder,
  LuLayoutDashboard,
  LuLibrary,
  LuList,
  LuMessageCircle,
  LuSearch,
  LuSparkles,
} from "react-icons/lu";

const apps = [
  {
    name: "Chat",
    icon: LuMessageCircle,
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-50 dark:bg-blue-950/50",
  },
  {
    name: "Library",
    icon: LuLibrary,
    color: "text-purple-600 dark:text-purple-400",
    bgColor: "bg-purple-50 dark:bg-purple-950/50",
  },
  {
    name: "King",
    icon: LuCrown,
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-50 dark:bg-green-950/50",
  },
  {
    name: "Dashboard",
    icon: LuLayoutDashboard,
    color: "text-cyan-600 dark:text-cyan-400",
    bgColor: "bg-cyan-50 dark:bg-cyan-950/50",
  },
  {
    name: "File Manager",
    icon: LuFolder,
    color: "text-orange-600 dark:text-orange-400",
    bgColor: "bg-orange-50 dark:bg-orange-950/50",
  },
  {
    name: "List",
    icon: LuList,
    color: "text-pink-600 dark:text-pink-400",
    bgColor: "bg-pink-50 dark:bg-pink-950/50",
  },
  {
    name: "Sparkles",
    icon: LuSparkles,
    color: "text-indigo-600 dark:text-indigo-400",
    bgColor: "bg-indigo-50 dark:bg-indigo-950/50",
  },
  {
    name: "Search",
    icon: LuSearch,
    color: "text-teal-600 dark:text-teal-400",
    bgColor: "bg-teal-50 dark:bg-teal-950/50",
  },
];

export function AppsHero() {
  return (
    <div className="w-full h-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center relative overflow-hidden">
      {/* App Icons Grid */}
      <div className="grid grid-cols-4 gap-20 w-full h-full p-16">
        {/* Row 1 */}
        <div className="flex justify-center items-center">
          <div className={`inline-flex items-center justify-center size-36 ${apps[0].bgColor} ${apps[0].color} rounded-2xl shadow-lg`}>
            {(() => {
              const IconComponent = apps[0].icon;
              return <IconComponent className="size-24" />;
            })()}
          </div>
        </div>
        <div className="flex justify-center items-center">
          <div className={`inline-flex items-center justify-center size-36 ${apps[1].bgColor} ${apps[1].color} rounded-2xl shadow-lg`}>
            {(() => {
              const IconComponent = apps[1].icon;
              return <IconComponent className="size-24" />;
            })()}
          </div>
        </div>
        <div className="flex justify-center items-center">
          <div className={`inline-flex items-center justify-center size-36 ${apps[2].bgColor} ${apps[2].color} rounded-2xl shadow-lg`}>
            {(() => {
              const IconComponent = apps[2].icon;
              return <IconComponent className="size-24" />;
            })()}
          </div>
        </div>
        <div className="flex justify-center items-center">
          <div className={`inline-flex items-center justify-center size-36 ${apps[3].bgColor} ${apps[3].color} rounded-2xl shadow-lg`}>
            {(() => {
              const IconComponent = apps[3].icon;
              return <IconComponent className="size-24" />;
            })()}
          </div>
        </div>

        {/* Row 2 */}
        <div className="flex justify-center items-center">
          <div className={`inline-flex items-center justify-center size-36 ${apps[4].bgColor} ${apps[4].color} rounded-2xl shadow-lg`}>
            {(() => {
              const IconComponent = apps[4].icon;
              return <IconComponent className="size-24" />;
            })()}
          </div>
        </div>
        <div className="flex justify-center items-center">
          <div className={`inline-flex items-center justify-center size-36 ${apps[5].bgColor} ${apps[5].color} rounded-2xl shadow-lg`}>
            {(() => {
              const IconComponent = apps[5].icon;
              return <IconComponent className="size-24" />;
            })()}
          </div>
        </div>
        <div className="flex justify-center items-center">
          <div className={`inline-flex items-center justify-center size-36 ${apps[6].bgColor} ${apps[6].color} rounded-2xl shadow-lg`}>
            {(() => {
              const IconComponent = apps[6].icon;
              return <IconComponent className="size-24" />;
            })()}
          </div>
        </div>
        <div className="flex justify-center items-center">
          <div className={`inline-flex items-center justify-center size-36 ${apps[7].bgColor} ${apps[7].color} rounded-2xl shadow-lg`}>
            {(() => {
              const IconComponent = apps[7].icon;
              return <IconComponent className="size-24" />;
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}
