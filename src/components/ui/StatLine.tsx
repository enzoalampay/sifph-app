// =============================================================================
// StatLine — compact icon+value display for unit stats (Defense, Morale, Speed)
// Uses stained-glass-style icons from /public/ to match ASOIAF card artwork.
// =============================================================================

interface StatLineProps {
  defense: string | number;
  morale: string | number;
  speed: string | number;
  size?: "sm" | "xs";
}

export function StatLine({
  defense,
  morale,
  speed,
  size = "sm",
}: StatLineProps) {
  const iconSize = size === "xs" ? "w-3.5 h-3.5" : "w-4 h-4";
  const textSize = size === "xs" ? "text-[10px]" : "text-xs";
  const gap = size === "xs" ? "gap-2.5" : "gap-3";

  return (
    <div className={`flex items-center ${gap}`}>
      <span className={`flex items-center gap-1 ${textSize} text-stone-300`}>
        <img src="/Defense.png" alt="DEF" className={iconSize} />
        {defense}
      </span>
      <span className={`flex items-center gap-1 ${textSize} text-stone-300`}>
        <img src="/Morale.png" alt="MOR" className={iconSize} />
        {morale}
      </span>
      <span className={`flex items-center gap-1 ${textSize} text-stone-300`}>
        <img src="/Speed.png" alt="SPD" className={iconSize} />
        {speed}
      </span>
    </div>
  );
}
