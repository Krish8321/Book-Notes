import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./AuthPage.css";

function AuthPage({ onLogin }) {
  const [mode, setMode] = useState("login"); // 'login' | 'register'
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const isLogin = mode === "login";

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const url = isLogin ? "/auth/login" : "/auth/register";

    const payload = isLogin
      ? { email: formData.email, password: formData.password }
      : {
          username: formData.username,
          email: formData.email,
          password: formData.password,
        };

    try {
      const res = await axios.post(url, payload);
      if (onLogin) onLogin(res.data.user);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.error || "Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    setError("");
    setFormData({ username: "", email: "", password: "" });
  };

  return (
    <div className="auth-page">
      {/* Left panel — branding */}
      <div className="auth-left">
        <div className="auth-brand">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          </svg>
          <span>Book Notes</span>
        </div>

        <div className="auth-left-body">
          <h1>
            Your reading life,
            <br />
            <em>beautifully kept.</em>
          </h1>
          <p>
            Track every book. Save every thought. Build your personal library.
          </p>
        </div>

        <div className="auth-left-footer">
          <div className="book-spine" style={{ "--c": "#bb86fc" }} />
          <div className="book-spine" style={{ "--c": "#f59e0b" }} />
          <div className="book-spine" style={{ "--c": "#34d399" }} />
          <div className="book-spine" style={{ "--c": "#f87171" }} />
          <div className="book-spine" style={{ "--c": "#60a5fa" }} />
          <div
            className="book-spine"
            style={{ "--c": "#bb86fc", "--h": "80px" }}
          />
          <div
            className="book-spine"
            style={{ "--c": "#fbbf24", "--h": "60px" }}
          />
        </div>
      </div>

      {/* Right panel — form */}
      <div className="auth-right">
        <div className="auth-card">
          {/* Toggle tabs */}
          <div className="auth-tabs">
            <button
              className={`auth-tab ${isLogin ? "active" : ""}`}
              onClick={() => switchMode("login")}
            >
              Sign In
            </button>
            <button
              className={`auth-tab ${!isLogin ? "active" : ""}`}
              onClick={() => switchMode("register")}
            >
              Create Account
            </button>
            <div
              className={`auth-tab-indicator ${isLogin ? "left" : "right"}`}
            />
          </div>

          <div className="auth-form-header">
            <h2>{isLogin ? "Welcome back" : "Join Book Notes"}</h2>
            <p>
              {isLogin
                ? "Sign in to your library"
                : "Start tracking your reading journey"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            {!isLogin && (
              <div className="auth-field">
                <label htmlFor="username">Username</label>
                <input
                  id="username"
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="e.g. batman_reads"
                  required={!isLogin}
                  autoComplete="username"
                />
              </div>
            )}

            <div className="auth-field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                required
                autoComplete="email"
              />
            </div>

            <div className="auth-field">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder={isLogin ? "••••••••" : "Min. 8 characters"}
                required
                autoComplete={isLogin ? "current-password" : "new-password"}
              />
            </div>

            {error && <div className="auth-error">{error}</div>}

            <button type="submit" className="auth-submit" disabled={loading}>
              {loading
                ? "Please wait..."
                : isLogin
                  ? "Sign In →"
                  : "Create Account →"}
            </button>
          </form>

          <p className="auth-switch">
            {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
            <button onClick={() => switchMode(isLogin ? "register" : "login")}>
              {isLogin ? "Create one" : "Sign in"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

export default AuthPage;
