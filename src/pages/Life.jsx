import { useState, useEffect, useMemo } from "react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";
import { renderMultiSectionDigitalClockTimeView } from "@mui/x-date-pickers/timeViewRenderers";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import { AnimatedThemeToggler } from "@/registry/magicui/animated-theme-toggler";

function Life({ mode, toggleTheme }) {
  const [birthDate, setBirthDate] = useState(() => {
    const saved = localStorage.getItem("birthDate");
    return saved ? dayjs(saved) : null;
  });

  const [tempDate, setTempDate] = useState(null);

  useEffect(() => {
    if (birthDate) {
      localStorage.setItem("birthDate", birthDate.toISOString());
    } else {
      localStorage.removeItem("birthDate");
    }
  }, [birthDate]);

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
        components: {
          MuiOutlinedInput: {
            styleOverrides: {
              root: {
                borderRadius: "50px",
              },
            },
          },
        },
      }),
    [mode],
  );

  const calculateLifeStats = () => {
    if (!birthDate) return null;
    const now = dayjs();
    const lifeExpectancy = 80;
    const totalWeeks = lifeExpectancy * 52;
    const weeksLived = now.diff(birthDate, "week");
    const percentage = (weeksLived / totalWeeks) * 100;

    return { weeksLived, totalWeeks, percentage };
  };

  const stats = calculateLifeStats();

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

        <div className="year-progress card" style={{ fontSize: "2rem" }}>
          <h4 className="glow-text" style={{ marginBottom: "0.5rem" }}>
            Life Progress
          </h4>

          {!birthDate ? (
            <div style={{ marginTop: "2rem" }}>
              <p
                style={{
                  fontSize: "1rem",
                  color: theme.palette.text.secondary,
                  marginBottom: "2rem",
                }}
              >
                Enter your mental birthday to visualize your life in weeks.
                <br />
                <span style={{ fontSize: "0.8rem" }}>
                  (Based on 80 years expectancy)
                </span>
              </p>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "1rem",
                }}
              >
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <DatePicker
                    label="Date of Birth"
                    value={tempDate}
                    onChange={(newValue) => setTempDate(newValue)}
                    views={["year", "month", "day"]}
                    format="DD/MM/YYYY"
                    slotProps={{
                      textField: {
                        className: "pill-input",
                        sx: { width: 300 },
                      },
                    }}
                  />
                  {tempDate && (
                    <TimePicker
                      label="Time of Birth"
                      value={tempDate}
                      onChange={(newValue) => setTempDate(newValue)}
                      views={["hours", "minutes"]}
                      format="HH:mm"
                      timeSteps={{ minutes: 1 }}
                      viewRenderers={{
                        hours: renderMultiSectionDigitalClockTimeView,
                        minutes: renderMultiSectionDigitalClockTimeView,
                      }}
                      slotProps={{
                        textField: {
                          className: "pill-input",
                          sx: { width: 300 },
                        },
                      }}
                    />
                  )}
                </LocalizationProvider>
                <button
                  onClick={() => tempDate && setBirthDate(tempDate)}
                  disabled={!tempDate}
                  style={{
                    background: tempDate ? "#22c55e" : "rgba(255,255,255,0.1)",
                    color: tempDate ? "#000" : "rgba(255,255,255,0.3)",
                    border: "none",
                    padding: "0.8rem 2rem",
                    borderRadius: "50px",
                    cursor: tempDate ? "pointer" : "not-allowed",
                    fontSize: "1rem",
                    fontWeight: 600,
                    transition: "all 0.2s",
                  }}
                >
                  Visualize Life
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="year-percent">{stats.percentage.toFixed(5)}%</div>
              <div className="progress-bar-container">
                <div
                  className="progress-bar-fill"
                  style={{ width: `${Math.min(stats.percentage, 100)}%` }}
                ></div>
              </div>

              <div
                style={{
                  marginTop: "3rem",
                  display: "flex",
                  flexWrap: "wrap",
                  justifyContent: "center",
                  gap: "2px",
                }}
              >
                {Array.from({ length: Math.min(stats.totalWeeks, 4160) }).map(
                  (_, i) => (
                    <div
                      key={i}
                      style={{
                        width: "4px",
                        height: "4px",
                        backgroundColor:
                          i < stats.weeksLived
                            ? "#22c55e"
                            : mode === "dark"
                              ? "rgba(255,255,255,0.1)"
                              : "rgba(0,0,0,0.1)",
                        borderRadius: "1px",
                      }}
                    />
                  ),
                )}
              </div>

              <div style={{ marginTop: "2rem" }}>
                <button
                  onClick={() => setBirthDate(null)}
                  style={{
                    background: "transparent",
                    border: "1px solid rgba(255,255,255,0.2)",
                    color: theme.palette.text.secondary,
                    padding: "0.5rem 1rem",
                    borderRadius: "20px",
                    cursor: "pointer",
                  }}
                >
                  Reset Birthdate
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </ThemeProvider>
  );
}

export default Life;
