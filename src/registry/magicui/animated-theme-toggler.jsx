import { Moon, Sun } from "lucide-react";
import { motion } from "framer-motion";

export function AnimatedThemeToggler({ isDark, toggleTheme }) {
  return (
    <button
      onClick={toggleTheme}
      title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
      style={{
        background: "transparent",
        border: isDark ? "1px solid rgba(255,255,255,0.1)" : "none",
        borderRadius: "50%",
        cursor: "pointer",
        position: "relative",
        width: "40px",
        height: "40px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        padding: 0,
      }}
    >
      <motion.div
        initial={false}
        animate={{
          scale: isDark ? 0 : 1,
          rotate: isDark ? 90 : 0,
          opacity: isDark ? 0 : 1,
        }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
        style={{ position: "absolute" }}
      >
        <Sun size={20} color="#facc15" /> {/* Yellow Sun */}
      </motion.div>
      <motion.div
        initial={false}
        animate={{
          scale: isDark ? 1 : 0,
          rotate: isDark ? 0 : -90,
          opacity: isDark ? 1 : 0,
        }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
        style={{ position: "absolute" }}
      >
        <Moon size={20} color="#f8fafc" /> {/* White Moon */}
      </motion.div>
    </button>
  );
}
