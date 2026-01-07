import { useState, useEffect, useMemo } from "react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { Link } from "react-router-dom";
import dayjs from "dayjs";
import { AnimatedThemeToggler } from "@/registry/magicui/animated-theme-toggler";
import { Rocket, Star, Calendar, Clock } from "lucide-react";

function Milestones({ mode, toggleTheme }) {
  const [now, setNow] = useState(dayjs());
  const [birthDate, setBirthDate] = useState(() => {
    const saved = localStorage.getItem("birthDate");
    return saved ? dayjs(saved) : null;
  });

  useEffect(() => {
    const timer = setInterval(() => setNow(dayjs()), 1000);
    return () => clearInterval(timer);
  }, []);

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
    [mode]
  );

  const calculateMilestones = () => {
    if (!birthDate) return [];

    // Power of 10 seconds milestones
    const secondsAlive = now.diff(birthDate, "seconds");
    const nextPowerOf10 = Math.pow(10, Math.ceil(Math.log10(secondsAlive)));
    const nextPowerOf10Date = birthDate.add(nextPowerOf10, "seconds");

    // 1 Billion seconds (special case if not passed, or 2B, 3B)
    const billion = 1_000_000_000;
    const nextBillionMultiplier = Math.ceil(secondsAlive / billion);
    const nextBillionDate = birthDate.add(
      nextBillionMultiplier * billion,
      "seconds"
    );

    // 10,000 Days
    const daysAlive = now.diff(birthDate, "days");
    const next10kMultiplier = Math.ceil(daysAlive / 10000);
    const next10kDate = birthDate.add(next10kMultiplier * 10000, "days");

    return [
      {
        label: "Total Seconds Alive",
        value: secondsAlive.toLocaleString(),
        icon: Clock,
        isStat: true,
      },
      {
        label: "Total Days Alive",
        value: daysAlive.toLocaleString(),
        icon: Calendar,
        isStat: true,
      },
      {
        label: `Approaching ${nextBillionMultiplier} Billion Seconds`,
        date: nextBillionDate,
        icon: Rocket,
        description: "A major cosmic milestone.",
      },
      {
        label: `Approaching ${next10kMultiplier * 10}k Days`,
        date: next10kDate,
        icon: Star,
        description: "Another ten thousand days of wisdom.",
      },
    ];
  };

  const milestones = calculateMilestones();

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <div
        className={`page-content ${mode === "light" ? "light-mode" : ""}`}
      >
        <div
          style={{
            position: "absolute",
            top: "1rem",
            right: "1rem",
            zIndex: 50,
          }}
        >
          <AnimatedThemeToggler
            isDark={mode === "dark"}
            toggleTheme={toggleTheme}
          />
        </div>

        <div className="section-title">Time Travel</div>

        {!birthDate ? (
          <div
            className="card"
            style={{ textAlign: "center", padding: "3rem" }}
          >
            <p style={{ marginBottom: "2rem" }}>
              Enter your birthday to see your personal time milestones.
            </p>
            <Link
              to="/life"
              style={{
                background: "#22c55e",
                color: "#000",
                padding: "1rem 2rem",
                borderRadius: "50px",
                textDecoration: "none",
                fontWeight: "bold",
              }}
            >
              Setup Birthday
            </Link>
          </div>
        ) : (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}
          >
            {milestones.map((m, i) => (
              <div
                key={i}
                className="card"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "1.5rem",
                  padding: "1.5rem",
                }}
              >
                <div
                  style={{
                    background:
                      mode === "dark"
                        ? "rgba(255,255,255,0.05)"
                        : "rgba(0,0,0,0.05)",
                    padding: "1rem",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <m.icon size={24} color="#22c55e" />
                </div>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: "0.8rem",
                      textTransform: "uppercase",
                      letterSpacing: "1px",
                      color: theme.palette.text.secondary,
                    }}
                  >
                    {m.label}
                  </div>
                  <div
                    style={{
                      fontSize: "1.5rem",
                      fontWeight: "bold",
                      margin: "0.2rem 0",
                    }}
                  >
                    {m.isStat ? m.value : m.date.format("DD/MM/YYYY")}
                  </div>
                  {!m.isStat && (
                    <div style={{ fontSize: "0.9rem", color: "#22c55e" }}>
                      {m.date.diff(now, "day")} days remaining
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </ThemeProvider>
  );
}

export default Milestones;
