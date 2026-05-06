import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo,
    });
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "2rem",
            background: "#050505",
            color: "#fff",
            textAlign: "center",
          }}
        >
          <h1 style={{ marginBottom: "1rem", color: "#ef4444" }}>
            Something went wrong
          </h1>
          <p style={{ marginBottom: "2rem", color: "#94a3b8" }}>
            The app encountered an error. Please try refreshing.
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null, errorInfo: null });
              window.location.reload();
            }}
            style={{
              padding: "1rem 2rem",
              background: "#22c55e",
              color: "#000",
              border: "none",
              borderRadius: "50px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Refresh App
          </button>
          {import.meta.env.DEV && this.state.error && (
            <details
              style={{
                marginTop: "2rem",
                textAlign: "left",
                maxWidth: "600px",
              }}
            >
              <summary style={{ cursor: "pointer", color: "#94a3b8" }}>
                Error Details
              </summary>
              <pre
                style={{
                  background: "#1e1e1e",
                  padding: "1rem",
                  borderRadius: "8px",
                  overflow: "auto",
                  fontSize: "0.8rem",
                }}
              >
                {this.state.error.toString()}
                {this.state.errorInfo?.componentStack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
