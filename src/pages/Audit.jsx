import { useState, useMemo } from "react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { AnimatedThemeToggler } from "@/registry/magicui/animated-theme-toggler";
import Slider from "@mui/material/Slider";

function Audit({ mode, toggleTheme }) {
  const [data, setData] = useState({
    work: 8,
    sleep: 8,
    commute: 1,
    chores: 2,
  });

  const handleChange = (name) => (e, val) => {
    setData({ ...data, [name]: val });
  };

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          ...(mode === "dark"
            ? {
                background: { default: "#050505", paper: "#1e1e1e" },
                text: { primary: "#ffffff", secondary: "#a0a0a0" },
              }
            : {
                background: { default: "#f8fafc", paper: "#ffffff" },
                text: { primary: "#0f172a", secondary: "#475569" },
              }),
        },
        typography: { fontFamily: '"Montserrat", system-ui, sans-serif' },
      }),
    [mode],
  );

  const totalUsed = Object.values(data).reduce((a, b) => a + b, 0);
  const freeTime = Math.max(0, 24 - totalUsed);

  // Calculate percentage of 24h
  const getPercent = (val) => (val / 24) * 100;

  const categories = [
    { id: "work", label: "Work & Study", color: "#3b82f6" },
    { id: "sleep", label: "Sleep", color: "#8b5cf6" },
    { id: "commute", label: "Commute", color: "#f59e0b" },
    { id: "chores", label: "Chores & Food", color: "#ef4444" },
  ];

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <div className={`page-content ${mode === "light" ? "light-mode" : ""}`}>
        <div
          style={{
            position: "absolute",
            top: "calc(1rem + env(safe-area-inset-top))",
            right: "1rem",
            zIndex: 50,
          }}
        >
          <AnimatedThemeToggler
            isDark={mode === "dark"}
            toggleTheme={toggleTheme}
          />
        </div>

        <div className="section-title">Time Audit</div>

        {/* Free Time Big Display */}
        <div
          className="card"
          style={{
            textAlign: "center",
            marginBottom: "2rem",
            width: "100%",
            maxWidth: "600px",
          }}
        >
          <div
            style={{
              fontSize: "1rem",
              color: theme.palette.text.secondary,
              textTransform: "uppercase",
              letterSpacing: "2px",
            }}
          >
            Your Free Time
          </div>
          <div
            style={{
              fontSize: "4rem",
              fontWeight: "800",
              color: "#22c55e",
              lineHeight: "1",
              margin: "1rem 0",
            }}
          >
            {freeTime.toFixed(1)}{" "}
            <span style={{ fontSize: "1.5rem" }}>hrs</span>
          </div>
          <div style={{ fontSize: "0.9rem", opacity: 0.7 }}>
            That's {((freeTime / 24) * 100).toFixed(1)}% of your day available
            for YOU.
          </div>
        </div>

        {/* Visual Bar */}
        <div
          style={{
            width: "100%",
            maxWidth: "600px",
            height: "30px",
            background: "rgba(255,255,255,0.1)",
            borderRadius: "15px",
            overflow: "hidden",
            display: "flex",
            marginBottom: "3rem",
          }}
        >
          {categories.map((cat) => (
            <div
              key={cat.id}
              style={{
                width: `${getPercent(data[cat.id])}%`,
                background: cat.color,
                height: "100%",
              }}
            />
          ))}
          <div
            style={{
              width: `${getPercent(freeTime)}%`,
              background: "#22c55e",
              height: "100%",
            }}
          />
        </div>

        {/* Sliders */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "2rem",
            width: "100%",
            maxWidth: "600px",
          }}
        >
          {categories.map((cat) => (
            <div key={cat.id}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "0.5rem",
                }}
              >
                <span
                  style={{
                    fontWeight: "600",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <div
                    style={{
                      width: "10px",
                      height: "10px",
                      borderRadius: "50%",
                      background: cat.color,
                    }}
                  />
                  {cat.label}
                </span>
                <span style={{ fontWeight: "bold" }}>{data[cat.id]} hrs</span>
              </div>
              <Slider
                value={data[cat.id]}
                min={0}
                max={16}
                step={0.5}
                onChange={handleChange(cat.id)}
                sx={{
                  color: cat.color,
                  height: 8,
                  "& .MuiSlider-thumb": {
                    width: 24,
                    height: 24,
                    backgroundColor: "#fff",
                    border: "2px solid currentColor",
                    "&:focus, &:hover, &.Mui-active, &.Mui-focusVisible": {
                      boxShadow: "inherit",
                    },
                  },
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </ThemeProvider>
  );
}

export default Audit;
