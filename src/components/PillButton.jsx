import { useThemeMode } from "@/theme/ThemeProvider";

export default function PillButton({
  active,
  onClick,
  children,
  accentColor = "#22c55e",
}) {
  const { mode } = useThemeMode();
  const inactiveColor = mode === "dark" ? "#64748b" : "#94a3b8";
  const inactiveBorder =
    mode === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)";

  return (
    <button
      onClick={onClick}
      style={{
        background: "transparent",
        border: `1px solid ${active ? accentColor : inactiveBorder}`,
        borderRadius: "50px",
        padding: "0.5rem 1rem",
        color: active ? accentColor : inactiveColor,
        cursor: "pointer",
        fontSize: "0.8rem",
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
        transition: "all 0.3s",
      }}
    >
      <span
        style={{
          width: "8px",
          height: "8px",
          borderRadius: "50%",
          backgroundColor: active ? accentColor : inactiveColor,
          boxShadow: active ? `0 0 10px ${accentColor}` : "none",
        }}
      />
      {children}
    </button>
  );
}
