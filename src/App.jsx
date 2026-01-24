import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Compare from "./pages/Compare";
import Life from "./pages/Life";
import Events from "./pages/Events";
import Focus from "./pages/Focus";
import Milestones from "./pages/Milestones";
import Vault from "./pages/Vault";
import Habits from "./pages/Habits";
import Audit from "./pages/Audit";
import World from "./pages/World";
import Navigation from "./components/Navigation";
import ErrorBoundary from "./components/ErrorBoundary";
import "./index.css";
import { Analytics } from "@vercel/analytics/react";

function App() {
  const [mode, setMode] = useState(() => {
    const savedMode = localStorage.getItem("theme");
    return savedMode || "dark";
  });

  useEffect(() => {
    document.body.classList.toggle("light-mode", mode === "light");
  }, [mode]);

  const toggleTheme = () => {
    setMode((prev) => {
      const newMode = prev === "dark" ? "light" : "dark";
      localStorage.setItem("theme", newMode);
      return newMode;
    });
  };

  return (
    <ErrorBoundary>
      <Router>
        <Routes>
          <Route
            path="/"
            element={<Home mode={mode} toggleTheme={toggleTheme} />}
          />
          <Route
            path="/compare"
            element={<Compare mode={mode} toggleTheme={toggleTheme} />}
          />
          <Route
            path="/life"
            element={<Life mode={mode} toggleTheme={toggleTheme} />}
          />
          <Route
            path="/events"
            element={<Events mode={mode} toggleTheme={toggleTheme} />}
          />
          <Route
            path="/focus"
            element={<Focus mode={mode} toggleTheme={toggleTheme} />}
          />
          <Route
            path="/milestones"
            element={<Milestones mode={mode} toggleTheme={toggleTheme} />}
          />
          <Route
            path="/vault"
            element={<Vault mode={mode} toggleTheme={toggleTheme} />}
          />
          <Route
            path="/habits"
            element={<Habits mode={mode} toggleTheme={toggleTheme} />}
          />
          <Route
            path="/audit"
            element={<Audit mode={mode} toggleTheme={toggleTheme} />}
          />
          <Route
            path="/world"
            element={<World mode={mode} toggleTheme={toggleTheme} />}
          />
        </Routes>
        <Navigation mode={mode} />
        <Analytics />
      </Router>
    </ErrorBoundary>
  );
}

export default App;
