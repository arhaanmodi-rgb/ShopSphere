import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Login() {
  const { loginUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [loginError, setLoginError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Check if redirected after registration
  const redirectedFrom = (location.state as { from?: string; message?: string })?.message;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setEmailError("");
    setPasswordError("");
    setLoginError("");
    setSuccessMessage("");

    let isValid = true;

    // Email validation
    if (!email.trim()) {
      setEmailError("Email is required.");
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setEmailError("Please enter a valid email address.");
      isValid = false;
    }

    // Password validation
    if (!password) {
      setPasswordError("Password is required.");
      isValid = false;
    }

    if (!isValid) return;

    try {
      setIsLoading(true);
      await loginUser(email.trim(), password);
      setSuccessMessage("Login successful! Redirecting to shop...");
      setTimeout(() => {
        navigate("/");
      }, 700);
    } catch (error) {
      if (error instanceof Error) {
        setLoginError(error.message);
      } else {
        setLoginError("Login failed. Please check your email and password.");
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className="auth-page-wrapper">
      <div className="auth-card-modern">
        {/* Header */}
        <div className="auth-header-block">
          <span className="auth-badge-label">WELCOME BACK</span>
          <h1 className="auth-title">Sign In</h1>
          <p className="auth-subtitle">
            Enter your credentials to access your ShopSphere account
          </p>
        </div>

        {/* Redirect Message Banner */}
        {redirectedFrom && (
          <div className="auth-info-banner">
            <span>ℹ️</span> {redirectedFrom}
          </div>
        )}

        {/* Error Alert */}
        {loginError && (
          <div className="auth-alert-error">
            <span className="alert-icon">⚠️</span>
            <span>{loginError}</span>
          </div>
        )}

        {/* Success Alert */}
        {successMessage && (
          <div className="auth-alert-success">
            <span className="alert-icon">✅</span>
            <span>{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form-layout" noValidate>
          {/* Email Field */}
          <div className="form-field-group">
            <label htmlFor="email">Email Address</label>
            <div className="input-with-icon">
              <span className="input-icon">✉️</span>
              <input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setEmailError("");
                  setLoginError("");
                }}
                disabled={isLoading}
                autoComplete="email"
              />
            </div>
            {emailError && <p className="form-field-error">{emailError}</p>}
          </div>

          {/* Password Field */}
          <div className="form-field-group">
            <div className="label-row">
              <label htmlFor="password">Password</label>
              <span className="forgot-hint">Forgot?</span>
            </div>
            <div className="input-with-icon">
              <span className="input-icon">🔒</span>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setPasswordError("");
                  setLoginError("");
                }}
                disabled={isLoading}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="pwd-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            {passwordError && (
              <p className="form-field-error">{passwordError}</p>
            )}
          </div>

          {/* Submit Button */}
          <button type="submit" className="btn-auth-submit" disabled={isLoading}>
            {isLoading ? (
              <span className="btn-spinner-content">
                <span className="spinner-dots"></span> Authenticating...
              </span>
            ) : (
              "Sign In to Account"
            )}
          </button>
        </form>

        {/* Footer Link */}
        <div className="auth-card-footer">
          <p>
            Don't have an account?{" "}
            <Link to="/register" className="auth-switch-link">
              Create one now
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}

export default Login;