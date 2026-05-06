import { useThemeMode } from "@/theme/ThemeProvider";
import { AnimatedThemeToggler } from "@/registry/magicui/animated-theme-toggler";

const cornerStyle = (side) => ({
  position: "absolute",
  top: "calc(1rem + env(safe-area-inset-top))",
  [side]: "1rem",
  zIndex: 50,
});

export default function PageShell({
  children,
  topLeft,
  contentStyle,
  contentClassName,
}) {
  const { mode, toggleTheme } = useThemeMode();
  const className = [
    "page-content",
    mode === "light" ? "light-mode" : "",
    contentClassName,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <>
      {topLeft && <div style={cornerStyle("left")}>{topLeft}</div>}
      <div style={cornerStyle("right")}>
        <AnimatedThemeToggler
          isDark={mode === "dark"}
          toggleTheme={toggleTheme}
        />
      </div>
      <div className={className} style={contentStyle}>
        {children}
      </div>
    </>
  );
}
