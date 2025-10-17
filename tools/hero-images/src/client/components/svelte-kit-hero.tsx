import {
  SiSvelte
} from "react-icons/si";

export function SvelteKitHero() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="flex items-center gap-4">
        <SiSvelte className="size-28 text-[#FF3E00]" />
        <h1 className="text-8xl tracking-widest font-medium">
          <span className="text-[#4A4A4A]">SVELTE</span><span className="text-[#888888]">KIT</span>
        </h1>
      </div>
    </div>
  );
}
