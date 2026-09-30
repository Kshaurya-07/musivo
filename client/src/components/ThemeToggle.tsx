import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

interface ThemeToggleProps {
  compact?: boolean;
  className?: string;
}

export function ThemeToggle({ compact = false, className = "" }: ThemeToggleProps) {
  const { theme, toggleTheme, isDark } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={`Switch to ${isDark ? "Day" : "Night"} mode`}
      aria-label={`Current theme is ${isDark ? "Night" : "Day"} mode. Click to switch.`}
      className={`group relative inline-flex items-center gap-2 rounded-full border border-[#e0e0e0] dark:border-[#292929] bg-[#ffffff] dark:bg-[#151515] hover:bg-[#f1f1f1] dark:hover:bg-[#202020] text-[#111111] dark:text-[#ffffff] transition-all duration-200 shadow-sm active:scale-95 ${
        compact ? "h-9 w-9 justify-center p-0" : "px-3 py-1.5 text-xs font-semibold"
      } ${className}`}
    >
      {isDark ? (
        <>
          <Moon className="h-3.5 w-3.5 text-[#c2c2c2] group-hover:text-white transition-colors" />
          {!compact && <span className="font-mono text-[11px] tracking-wide">Night</span>}
        </>
      ) : (
        <>
          <Sun className="h-3.5 w-3.5 text-[#555555] group-hover:text-black transition-colors" />
          {!compact && <span className="font-mono text-[11px] tracking-wide">Day</span>}
        </>
      )}
    </button>
  );
}
