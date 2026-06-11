import { useEffect } from "react";
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
import Pulse from "./pages/Pulse";
import Wallpaper from "./pages/Wallpaper";
import Wrap from "./pages/Wrap";
import Goals from "./pages/Goals";
import Memories from "./pages/Memories";
import Compete from "./pages/Compete";
import Data from "./pages/Data";
import Navigation from "./components/Navigation";
import ErrorBoundary from "./components/ErrorBoundary";
import { AppThemeProvider } from "./theme/ThemeProvider";
import {
  setSharedDefault,
  reloadIosWidgets,
  sharedDefaultsSupported,
} from "./hooks/useSharedDefaults";
import useDeepLinks from "./hooks/useDeepLinks";
import { trackEvent } from "./lib/analytics";
import "./index.css";
import { Analytics } from "@vercel/analytics/react";

function DeepLinks() {
  useDeepLinks();
  return null;
}

function InstallTracker() {
  // Fires when the PWA is installed to the home screen / desktop — a key
  // acquisition signal we otherwise can't see in pageview analytics.
  useEffect(() => {
    const onInstalled = () => trackEvent("app_installed", { kind: "pwa" });
    window.addEventListener("appinstalled", onInstalled);
    return () => window.removeEventListener("appinstalled", onInstalled);
  }, []);
  return null;
}

function IosWidgetMirror() {
  // Sync local data into the iOS App Group on every app launch + once per
  // hour while open. The Widget Extension reads from the same App Group.
  useEffect(() => {
    if (!sharedDefaultsSupported) return;
    const sync = async () => {
      try {
        const birth = localStorage.getItem("birthDate");
        if (birth) {
          await setSharedDefault("widget_birth_date", JSON.stringify(birth));
        }
        const pulse = localStorage.getItem("widget_pulse");
        if (pulse) {
          await setSharedDefault("widget_pulse", pulse);
        }
        const goal = localStorage.getItem("wallpaper_goal");
        if (goal) {
          await setSharedDefault("widget_goal", goal);
        }
        await reloadIosWidgets();
      } catch (e) {
        console.debug("iOS widget mirror skipped", e);
      }
    };
    sync();
    const interval = setInterval(sync, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);
  return null;
}

function App() {
  return (
    <ErrorBoundary>
      <AppThemeProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/compare" element={<Compare />} />
            <Route path="/life" element={<Life />} />
            <Route path="/events" element={<Events />} />
            <Route path="/focus" element={<Focus />} />
            <Route path="/milestones" element={<Milestones />} />
            <Route path="/vault" element={<Vault />} />
            <Route path="/habits" element={<Habits />} />
            <Route path="/audit" element={<Audit />} />
            <Route path="/world" element={<World />} />
            <Route path="/pulse" element={<Pulse />} />
            <Route path="/wallpaper" element={<Wallpaper />} />
            <Route path="/wrap" element={<Wrap />} />
            <Route path="/goals" element={<Goals />} />
            <Route path="/memories" element={<Memories />} />
            <Route path="/compete" element={<Compete />} />
            <Route path="/data" element={<Data />} />
          </Routes>
          <Navigation />
          <DeepLinks />
          <InstallTracker />
          <IosWidgetMirror />
          <Analytics />
        </Router>
      </AppThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
