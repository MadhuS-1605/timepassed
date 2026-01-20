import { useState, useEffect, useMemo } from "react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { AnimatedThemeToggler } from "@/registry/magicui/animated-theme-toggler";
import { Plus, Trash2, Globe, X, GripVertical } from "lucide-react";
import { Reorder } from "framer-motion";

function World({ mode, toggleTheme }) {
  const [zones, setZones] = useState(() => {
    const saved = localStorage.getItem("worldZones");
    return saved
      ? JSON.parse(saved)
      : [
          "Asia/Kolkata",
          "UTC",
          "America/New_York",
          "Europe/London",
          "Asia/Tokyo",
        ];
  });

  const [isDesktop, setIsDesktop] = useState(window.innerWidth > 1024);

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth > 1024);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const [date, setDate] = useState(new Date());
  const [isAdding, setIsAdding] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const timer = setInterval(() => setDate(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    localStorage.setItem("worldZones", JSON.stringify(zones));
  }, [zones]);

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

  const availableZones = useMemo(() => {
    try {
      const allZones = Intl.supportedValuesOf("timeZone");
      const prioritize = ["Asia/Kolkata"];
      const sorted = allZones
        .filter((z) => !prioritize.includes(z))
        .sort((a, b) => {
          const nameA = a.includes("/")
            ? a.split("/").slice(1).join(" ").replace(/_/g, " ")
            : a;
          const nameB = b.includes("/")
            ? b.split("/").slice(1).join(" ").replace(/_/g, " ")
            : b;
          return nameA.localeCompare(nameB);
        });
      return [...prioritize, ...sorted];
    } catch (e) {
      console.error("Intl.supportedValuesOf not supported", e);
      return [
        "Asia/Kolkata",
        "UTC",
        "America/New_York",
        "Europe/London",
        "Asia/Tokyo",
      ];
    }
  }, []);

  const addZone = (zone) => {
    if (!zones.includes(zone)) {
      setZones([...zones, zone]);
    }
  };

  const removeZone = (zone) => {
    setZones(zones.filter((z) => z !== zone));
  };

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

        <div className="section-title">World Clock</div>

        <Reorder.Group
          values={zones}
          onReorder={setZones}
          style={
            isDesktop
              ? {
                  display: "flex",
                  flexWrap: "wrap",
                  justifyContent: "center",
                  gap: "1.5rem",
                  width: "100%",
                  maxWidth: "1200px",
                  listStyle: "none",
                  padding: 0,
                  margin: "0 auto",
                }
              : {
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "1rem",
                  width: "100%",
                  maxWidth: "800px",
                  listStyle: "none",
                  padding: 0,
                  margin: "0 auto",
                }
          }
        >
          {zones.map((zone) => {
            const timeString = date.toLocaleTimeString("en-US", {
              timeZone: zone,
              hour: "2-digit",
              minute: "2-digit",
            });
            const dateString = date.toLocaleDateString("en-US", {
              timeZone: zone,
              weekday: "short",
              month: "short",
              day: "numeric",
            });
            const cleanZoneName = zone.includes("/")
              ? zone.split("/").slice(1).join(" ").replace(/_/g, " ")
              : zone;

            return (
              <Reorder.Item
                key={zone}
                value={zone}
                id={zone}
                as="div"
                drag
                dragConstraints={{ top: 0, bottom: 0, left: 0, right: 0 }}
                dragElastic={1}
                whileDrag={{ scale: 1.05, zIndex: 100, cursor: "grabbing" }}
                style={{
                  position: "relative",
                  width: isDesktop ? "auto" : "100%",
                }}
              >
                <div
                  className="card"
                  style={
                    isDesktop
                      ? {
                          padding: "2rem",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          height: "100%",
                          cursor: "grab",
                          position: "relative",
                          minHeight: "200px",
                        }
                      : {
                          padding: "1.5rem 2rem",
                          display: "flex",
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "space-between",
                          height: "100%",
                          cursor: "grab",
                          gap: "1rem",
                          width: "100%",
                          position: "relative",
                        }
                  }
                >
                  {/* Grip Handle - Always Absolute Top Left */}
                  <div
                    style={{
                      position: "absolute",
                      top: "1rem",
                      left: "1rem",
                      opacity: 0.3,
                      cursor: "grab",
                    }}
                  >
                    <GripVertical size={16} />
                  </div>

                  {/* Delete Button - Always Absolute Top Right (Desktop) or Inline (Mobile)? */}
                  {/* Let's keep it absolute for consistency if possible, or conditional. */}
                  {/* For Desktop Grid: Absolute Top right is standard. */}
                  {/* For Mobile List: We had it inline on the right. Let's make it absolute top right for both to simplify layout? */}
                  {/* Actually, user liked the mobile list layout. Let's keep absolute for Desktop, inline for Mobile maybe? */}
                  {/* Let's try Absolute for both to clean up the mobile row as well. */}

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeZone(zone);
                    }}
                    style={{
                      position: "absolute",
                      top: "1rem",
                      right: "1rem",
                      background: "transparent",
                      border: "none",
                      color: theme.palette.text.secondary,
                      cursor: "pointer",
                      opacity: 0.5,
                      zIndex: 10,
                    }}
                    onPointerDown={(e) => e.stopPropagation()}
                  >
                    <Trash2 size={16} />
                  </button>

                  {isDesktop ? (
                    // DESKTOP CONTENT (Vertical Stack)
                    <>
                      <div
                        style={{
                          fontSize: "1rem",
                          textTransform: "uppercase",
                          letterSpacing: "2px",
                          color: theme.palette.text.secondary,
                          marginBottom: "0.5rem",
                          marginTop: "1rem", // space for grip/trash
                          textAlign: "center",
                        }}
                      >
                        {cleanZoneName}
                      </div>
                      <div
                        style={{
                          fontSize: "3rem",
                          fontWeight: "700",
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        {timeString}
                      </div>
                      <div
                        style={{
                          fontSize: "1rem",
                          color: "#22c55e",
                          fontWeight: "500",
                          marginTop: "0.5rem",
                        }}
                      >
                        {dateString}
                      </div>
                    </>
                  ) : (
                    // MOBILE CONTENT (Horizontal Row)
                    <>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "1rem",
                          paddingLeft: "1.5rem", // space for grip
                        }}
                      >
                        <div>
                          <div
                            style={{
                              fontSize: "1.2rem",
                              fontWeight: "600",
                              color: theme.palette.text.primary,
                            }}
                          >
                            {cleanZoneName}
                          </div>
                          <div
                            style={{
                              fontSize: "0.9rem",
                              color: "#22c55e",
                              fontWeight: "500",
                            }}
                          >
                            {dateString}
                          </div>
                        </div>
                      </div>

                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "1.5rem",
                          paddingRight: "1.5rem", // space for trash
                        }}
                      >
                        <div
                          style={{
                            fontSize: "2rem",
                            fontWeight: "700",
                            fontVariantNumeric: "tabular-nums",
                          }}
                        >
                          {timeString}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </Reorder.Item>
            );
          })}
        </Reorder.Group>

        {/* Add Timezone Overlay */}
        {isAdding && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0,0,0,0.6)",
              zIndex: 100,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            onClick={() => setIsAdding(false)}
          >
            <div
              className="card"
              style={{
                width: "90%",
                maxWidth: "400px",
                height: "80vh",
                maxHeight: "600px",
                display: "flex",
                flexDirection: "column",
                gap: "1rem",
                borderRadius: "30px",
                padding: "1.5rem",
                background:
                  mode === "dark"
                    ? "rgba(20, 20, 20, 0.4)"
                    : "rgba(255, 255, 255, 0.4)",
                backdropFilter: "blur(25px) saturate(200%)",
                WebkitBackdropFilter: "blur(25px) saturate(200%)",
                border:
                  mode === "dark"
                    ? "1px solid rgba(255, 255, 255, 0.15)"
                    : "1px solid rgba(255, 255, 255, 0.4)",
                boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.2)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header Section (Fixed) */}
              <div style={{ flexShrink: 0 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "1rem",
                  }}
                >
                  <h3 style={{ margin: 0 }}>Add Timezone</h3>
                  <button
                    onClick={() => setIsAdding(false)}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: theme.palette.text.secondary,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <X size={24} />
                  </button>
                </div>

                <input
                  type="text"
                  placeholder="Search city..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "1rem",
                    borderRadius: "20px",
                    border:
                      mode === "dark"
                        ? "1px solid rgba(255,255,255,0.1)"
                        : "1px solid rgba(0,0,0,0.1)",
                    background:
                      mode === "dark"
                        ? "rgba(0, 0, 0, 0.2)"
                        : "rgba(255, 255, 255, 0.5)",
                    color: theme.palette.text.primary,
                    fontSize: "1rem",
                    outline: "none",
                  }}
                  autoFocus
                />
              </div>

              {/* Scrollable List Section */}
              <div
                style={{
                  flex: 1,
                  overflowY: "auto",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.5rem",
                  paddingRight: "0.5rem",
                }}
              >
                {availableZones
                  .filter(
                    (z) =>
                      !zones.includes(z) &&
                      z.toLowerCase().includes(searchTerm.toLowerCase()),
                  )
                  .map((z) => (
                    <button
                      key={z}
                      onClick={() => {
                        addZone(z);
                        setIsAdding(false);
                        setSearchTerm("");
                      }}
                      style={{
                        background:
                          mode === "dark"
                            ? "rgba(255,255,255,0.05)"
                            : "rgba(255,255,255,0.3)",
                        border: "none",
                        padding: "1rem",
                        borderRadius: "16px",
                        color: theme.palette.text.primary,
                        fontSize: "1rem",
                        textAlign: "left",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "1rem",
                        transition: "background 0.2s",
                        flexShrink: 0,
                      }}
                      onMouseEnter={(e) =>
                        (e.target.style.background = "rgba(34, 197, 94, 0.2)")
                      }
                      onMouseLeave={(e) =>
                        (e.target.style.background =
                          mode === "dark"
                            ? "rgba(255,255,255,0.05)"
                            : "rgba(255,255,255,0.3)")
                      }
                    >
                      <Globe size={20} color="#22c55e" />
                      {z.includes("/")
                        ? z.split("/").slice(1).join(" ").replace(/_/g, " ")
                        : z}
                    </button>
                  ))}

                {availableZones.filter(
                  (z) =>
                    !zones.includes(z) &&
                    z.toLowerCase().includes(searchTerm.toLowerCase()),
                ).length === 0 && (
                  <div
                    style={{
                      padding: "2rem",
                      textAlign: "center",
                      opacity: 0.5,
                      marginTop: "auto",
                      marginBottom: "auto",
                    }}
                  >
                    No matching timezones found.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Floating Action Button */}
        <button
          onClick={() => setIsAdding(true)}
          style={{
            position: "fixed",
            bottom: "100px",
            right: "1.5rem",
            background: "#22c55e",
            border: "none",
            borderRadius: "50%",
            width: "56px",
            height: "56px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#000",
            cursor: "pointer",
            transition: "all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
            zIndex: 90,
            boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
          }}
        >
          <Plus size={28} />
        </button>
      </div>
    </ThemeProvider>
  );
}

export default World;
