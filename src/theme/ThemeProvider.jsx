import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  ThemeProvider as MuiThemeProvider,
  createTheme,
} from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import useMaterialYou from "@/hooks/useMaterialYou";

const DEFAULT_ACCENT = "#22c55e";

const ThemeModeContext = createContext({
  mode: "dark",
  oled: false,
  materialYou: false,
  materialYouSupported: false,
  accent: DEFAULT_ACCENT,
  toggleTheme: () => {},
  toggleOled: () => {},
  toggleMaterialYou: () => {},
});

export const useThemeMode = () => useContext(ThemeModeContext);

const buildTheme = (mode, oled = false, accent = DEFAULT_ACCENT) =>
  createTheme({
    palette: {
      mode,
      primary: { main: accent },
      ...(mode === "dark"
        ? {
            background: {
              default: oled ? "#000000" : "#050505",
              paper: oled ? "#0a0a0a" : "#1e1e1e",
            },
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
          root: ({ theme }) => ({
            color: theme.palette.mode === "dark" ? "#fff" : "#000",
            backgroundColor:
              theme.palette.mode === "dark"
                ? "rgba(255, 255, 255, 0.03)"
                : "rgba(0, 0, 0, 0.03)",
            borderRadius: "50px",
            "& .MuiOutlinedInput-notchedOutline": {
              borderColor:
                theme.palette.mode === "dark"
                  ? "rgba(255, 255, 255, 0.1)"
                  : "rgba(0, 0, 0, 0.1)",
              borderRadius: "50px",
            },
            "&:hover .MuiOutlinedInput-notchedOutline": {
              borderColor:
                theme.palette.mode === "dark"
                  ? "rgba(255, 255, 255, 0.2)"
                  : "rgba(0, 0, 0, 0.2)",
            },
          }),
        },
      },
      MuiInputLabel: {
        styleOverrides: {
          root: ({ theme }) => ({
            color:
              theme.palette.mode === "dark"
                ? "rgba(255, 255, 255, 0.7)"
                : "rgba(0, 0, 0, 0.7)",
          }),
        },
      },
      MuiPickersDay: {
        styleOverrides: {
          root: ({ theme }) => ({
            color: theme.palette.mode === "dark" ? "#94a3b8" : "#475569",
            "&.Mui-selected": {
              backgroundColor: "#22c55e !important",
              color: "#000",
            },
            "&:hover": {
              backgroundColor: "rgba(34, 197, 94, 0.1)",
            },
          }),
        },
      },
      MuiDateCalendar: {
        styleOverrides: {
          root: ({ theme }) => ({
            backgroundColor:
              theme.palette.mode === "dark" ? "#0f0f13" : "#fff",
            color: theme.palette.mode === "dark" ? "#fff" : "#000",
          }),
        },
      },
      MuiMultiSectionDigitalClock: {
        styleOverrides: {
          root: ({ theme }) => ({
            backgroundColor:
              theme.palette.mode === "dark" ? "#0f0f13" : "#fff",
            color: theme.palette.mode === "dark" ? "#fff" : "#000",
            borderTop:
              theme.palette.mode === "dark"
                ? "1px solid rgba(255,255,255,0.1)"
                : "1px solid rgba(0,0,0,0.1)",
          }),
          item: ({ theme }) => ({
            color: theme.palette.mode === "dark" ? "#94a3b8" : "#475569",
            "&:hover": { backgroundColor: "rgba(34, 197, 94, 0.1)" },
            "&.Mui-selected": {
              backgroundColor: "#22c55e !important",
              color: "#000",
            },
          }),
        },
      },
    },
  });

export function AppThemeProvider({ children }) {
  const [mode, setMode] = useState(
    () => localStorage.getItem("theme") || "dark",
  );
  const [oled, setOled] = useState(
    () => localStorage.getItem("oled_mode") === "true",
  );
  const [materialYou, setMaterialYou] = useState(
    () => localStorage.getItem("material_you") === "true",
  );

  const dynamicColors = useMaterialYou();
  const materialYouSupported = !!dynamicColors.supported;
  const accent =
    materialYou && materialYouSupported && dynamicColors.primary
      ? dynamicColors.primary
      : DEFAULT_ACCENT;

  useEffect(() => {
    document.body.classList.toggle("light-mode", mode === "light");
  }, [mode]);

  useEffect(() => {
    document.body.classList.toggle(
      "oled-mode",
      oled && mode === "dark",
    );
  }, [oled, mode]);

  useEffect(() => {
    document.documentElement.style.setProperty("--accent", accent);
  }, [accent]);

  const toggleTheme = () => {
    setMode((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      localStorage.setItem("theme", next);
      return next;
    });
  };

  const toggleOled = () => {
    setOled((prev) => {
      const next = !prev;
      localStorage.setItem("oled_mode", String(next));
      return next;
    });
  };

  const toggleMaterialYou = () => {
    setMaterialYou((prev) => {
      const next = !prev;
      localStorage.setItem("material_you", String(next));
      return next;
    });
  };

  const theme = useMemo(
    () => buildTheme(mode, oled, accent),
    [mode, oled, accent],
  );
  const ctx = useMemo(
    () => ({
      mode,
      oled,
      materialYou,
      materialYouSupported,
      accent,
      toggleTheme,
      toggleOled,
      toggleMaterialYou,
    }),
    [mode, oled, materialYou, materialYouSupported, accent],
  );

  return (
    <ThemeModeContext.Provider value={ctx}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeModeContext.Provider>
  );
}
