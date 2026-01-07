import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Home,
  Calendar,
  Clock,
  Crosshair,
  Map,
  GitCompare,
  MoreHorizontal,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

function Navigation({ mode }) {
  const location = useLocation();
  const [showMore, setShowMore] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const checkDesktop = () => setIsDesktop(window.innerWidth >= 640);
    checkDesktop(); // Initial check
    window.addEventListener("resize", checkDesktop);
    return () => window.removeEventListener("resize", checkDesktop);
  }, []);

  const visibleItems = [
    { path: "/", icon: Home, label: "Home" }, // User requested "Home"
    { path: "/events", icon: Clock, label: "Events" }, // User requested "Events" 2nd
    { path: "/focus", icon: Crosshair, label: "Focus" }, // User requested "Focus" 3rd
    { path: "/life", icon: Calendar, label: "Life" }, // User requested "Life" 4th
  ];

  const moreItems = [
    { path: "/compare", icon: GitCompare, label: "Compare" },
    { path: "/milestones", icon: Map, label: "Travel" },
  ];

  const finalNavItems = isDesktop
    ? [...visibleItems, ...moreItems]
    : visibleItems;

  const isMoreActive = moreItems.some((item) =>
    location.pathname.startsWith(item.path)
  );

  return (
    <>
      <style>
        {`
          .nav-dock {
            padding: 0.4rem;
            gap: 0.25rem;
            bottom: 1.5rem;
            border-radius: 50px;
            max-width: 94vw;
          }
          .nav-item {
            padding: 0.4rem 0rem; 
            width: 72px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
          }
          .nav-item svg {
            width: 18px;
            height: 18px;
            display: block;
          }
          .nav-text {
            font-size: 0.65rem;
            margin-top: 2px;
            white-space: nowrap;
            text-align: center;
          }

          @media (min-width: 640px) {
            .nav-dock {
                padding: 0.4rem 0.8rem;
                gap: 0.25rem;
                bottom: 2rem;
                border-radius: 50px;
                max-width: none;
            }
            .nav-item {
                padding: 0.4rem 0.8rem;
                width: 80px;
            }
            .nav-item svg {
                width: 18px;
                height: 18px;
            }
            .nav-text {
                font-size: 0.7rem;
            }
          }
          
          .nav-dock::-webkit-scrollbar {
            display: none;
          }
        `}
      </style>

      {/* More Menu Popup - Only for Mobile */}
      {!isDesktop && (
        <AnimatePresence>
          {showMore && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              style={{
                position: "fixed",
                bottom: "calc(1.5rem + 70px)", // Position above nav
                right: "2rem",
                left: "50%",
                x: "-50%",
                background:
                  mode === "dark"
                    ? "rgba(20, 20, 20, 0.4)"
                    : "rgba(255, 255, 255, 0.9)",
                backdropFilter: "blur(25px) saturate(200%)",
                WebkitBackdropFilter: "blur(25px) saturate(200%)",
                borderRadius: "50px",
                padding: "0.5rem",
                display: "flex",
                gap: "0.5rem",
                boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.2)",
                zIndex: 1001,
                border:
                  mode === "dark"
                    ? "1px solid rgba(255, 255, 255, 0.1)"
                    : "1px solid rgba(255, 255, 255, 0.3)",
              }}
            >
              {moreItems.map(({ path, icon: Icon, label }) => {
                const isActive = location.pathname === path;
                return (
                  <Link
                    key={path}
                    to={path}
                    onClick={() => setShowMore(false)} // Close on click
                    className="nav-item"
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: "24px",
                      color: isActive
                        ? "#000000"
                        : mode === "dark"
                        ? "#a1a1aa"
                        : "#475569",
                      background: "transparent",
                      textDecoration: "none",
                      position: "relative",
                    }}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="more-pill"
                        style={{
                          position: "absolute",
                          inset: 0,
                          borderRadius: "24px",
                          backgroundColor: "#22c55e",
                          zIndex: 0,
                        }}
                      />
                    )}
                    <div
                      style={{
                        position: "relative",
                        zIndex: 1,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                      }}
                    >
                      <Icon />
                      <span
                        className="nav-text"
                        style={{ fontWeight: isActive ? 600 : 500 }}
                      >
                        {label}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* Main Dock */}
      <div
        className="nav-dock"
        style={{
          position: "fixed",
          left: "50%",
          transform: "translateX(-50%)",
          background:
            mode === "dark"
              ? "rgba(20, 20, 20, 0.4)"
              : "rgba(255, 255, 255, 0.4)",
          backdropFilter: "blur(25px) saturate(200%)",
          WebkitBackdropFilter: "blur(25px) saturate(200%)",
          display: "flex",
          boxShadow: `
            0 8px 32px 0 rgba(0, 0, 0, 0.2), 
            inset 0 0 0 1px ${
              mode === "dark"
                ? "rgba(255, 255, 255, 0.15)"
                : "rgba(255, 255, 255, 0.4)"
            }
          `,
          zIndex: 1000,
          border: "none",
          width: "max-content",
          overflowX: "auto",
        }}
      >
        {finalNavItems.map(({ path, icon: Icon, label }) => {
          // If the "More" menu is open, suppress the active state of visible items
          // so the "More" button takes the spotlight (and the green pill).
          // On Desktop, showMore is irrelevant so always check path.
          const isActive =
            location.pathname === path && (isDesktop || !showMore);

          return (
            <Link
              key={path}
              to={path}
              onClick={() => setShowMore(false)}
              className="nav-item"
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "24px",
                color: isActive
                  ? "#000000"
                  : mode === "dark"
                  ? "#a1a1aa"
                  : "#475569",
                background: "transparent",
                textDecoration: "none",
                transition: "color 0.3s ease",
                flex: "0 0 auto",
                position: "relative",
              }}
            >
              {isActive && (
                <motion.div
                  layoutId="nav-pill"
                  style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: "24px",
                    backgroundColor: "#22c55e",
                    zIndex: 0,
                  }}
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <div
                style={{
                  position: "relative",
                  zIndex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon />
                <span
                  className="nav-text"
                  style={{
                    fontWeight: isActive ? 600 : 500,
                    opacity: isActive ? 1 : 0.8,
                  }}
                >
                  {label}
                </span>
              </div>
            </Link>
          );
        })}

        {/* More Button - Mobile Only */}
        {!isDesktop && (
          <button
            onClick={() => setShowMore((prev) => !prev)}
            className="nav-item"
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "24px",
              color:
                isMoreActive || showMore
                  ? "#000000" // Active state
                  : mode === "dark"
                  ? "#a1a1aa"
                  : "#475569",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              position: "relative",
            }}
          >
            {(isMoreActive || showMore) && (
              <motion.div
                layoutId="nav-pill" // Shares same layoutId so green pill slides here
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: "24px",
                  backgroundColor: isMoreActive ? "#22c55e" : "#22c55e",
                  zIndex: 0,
                }}
              />
            )}
            <div
              style={{
                position: "relative",
                zIndex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <MoreHorizontal />
              <span
                className="nav-text"
                style={{ fontWeight: isMoreActive || showMore ? 600 : 500 }}
              >
                More
              </span>
            </div>
          </button>
        )}
      </div>
    </>
  );
}

export default Navigation;
