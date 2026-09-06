import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Register() {
  const { registerUser } = useAuth();
  const navigate = useNavigate();

  // Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Errors & Status
  const [nameError, setNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [registerError, setRegisterError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Password strength helper
  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { score: 0, text: "" };
    let score = 0;
    if (pwd.length >= 6) score += 1;
    if (pwd.length >= 10) score += 1;
    if (/[A-Z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd) || /[^A-Za-z0-9]/.test(pwd)) score += 1;

    if (score <= 1) return { score: 1, text: "Weak", color: "#e63946" };
    if (score <= 2) return { score: 2, text: "Fair", color: "#f4a261" };
    if (score <= 3) return { score: 3, text: "Good", color: "#2a9d8f" };
    return { score: 4, text: "Strong", color: "#2b9348" };
  };

  const strength = getPasswordStrength(password);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setNameError("");
    setEmailError("");
    setPasswordError("");
    setConfirmPasswordError("");
    setRegisterError("");
    setSuccessMessage("");

    let isValid = true;

    // Name validation
    if (!name.trim()) {
      setNameError("Full name is required.");
      isValid = false;
    } else if (name.trim().length < 2) {
      setNameError("Name must contain at least 2 characters.");
      isValid = false;
    }

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
    } else if (password.length < 6) {
      setPasswordError("Password must contain at least 6 characters.");
      isValid = false;
    }

    // Confirm Password
    if (!confirmPassword) {
      setConfirmPasswordError("Please confirm your password.");
      isValid = false;
    } else if (password !== confirmPassword) {
      setConfirmPasswordError("Passwords do not match.");
      isValid = false;
    }

    if (!isValid) return;

    try {
      setIsLoading(true);
      await registerUser(name.trim(), email.trim(), password);
      setSuccessMessage("Account created successfully! Redirecting to sign in...");
      setTimeout(() => {
        navigate("/login", {
          state: { message: "Account created! Please sign in with your credentials." },
        });
      }, 900);
    } catch (error) {
      if (error instanceof Error) {
        setRegisterError(error.message);
      } else {
        setRegisterError("Registration failed. Please check your details.");
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
          <span className="auth-badge-label">JOIN SHOPSPHERE</span>
          <h1 className="auth-title">Create Account</h1>
          <p className="auth-subtitle">
            Create an account to start shopping and tracking your orders
          </p>
        </div>

        {/* Error Alert */}
        {registerError && (
          <div className="auth-alert-error">
            <span className="alert-icon">⚠️</span>
            <span>{registerError}</span>
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
          {/* Full Name */}
          <div className="form-field-group">
            <label htmlFor="register-name">Full Name</label>
            <div className="input-with-icon">
              <span className="input-icon">👤</span>
              <input
                id="register-name"
                type="text"
                placeholder="Jane Doe"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setNameError("");
                  setRegisterError("");
                }}
                disabled={isLoading}
                autoComplete="name"
              />
            </div>
            {nameError && <p className="form-field-error">{nameError}</p>}
          </div>

          {/* Email */}
          <div className="form-field-group">
            <label htmlFor="register-email">Email Address</label>
            <div className="input-with-icon">
              <span className="input-icon">✉️</span>
              <input
                id="register-email"
                type="email"
                placeholder="jane@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setEmailError("");
                  setRegisterError("");
                }}
                disabled={isLoading}
                autoComplete="email"
              />
            </div>
            {emailError && <p className="form-field-error">{emailError}</p>}
          </div>

          {/* Password */}
          <div className="form-field-group">
            <label htmlFor="register-password">Create Password</label>
            <div className="input-with-icon">
              <span className="input-icon">🔒</span>
              <input
                id="register-password"
                type={showPassword ? "text" : "password"}
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setPasswordError("");
                  setRegisterError("");
                }}
                disabled={isLoading}
                autoComplete="new-password"
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
            {password && (
              <div className="password-strength-indicator">
                <div className="strength-bar-track">
                  <div
                    className="strength-bar-fill"
                    style={{
                      width: `${(strength.score / 4) * 100}%`,
                      backgroundColor: strength.color,
                    }}
                  />
                </div>
                <span className="strength-text" style={{ color: strength.color }}>
                  {strength.text}
                </span>
              </div>
            )}
            {passwordError && (
              <p className="form-field-error">{passwordError}</p>
            )}
          </div>

          {/* Confirm Password */}
          <div className="form-field-group">
            <label htmlFor="confirm-password">Confirm Password</label>
            <div className="input-with-icon">
              <span className="input-icon">🔒</span>
              <input
                id="confirm-password"
                type={showPassword ? "text" : "password"}
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setConfirmPasswordError("");
                  setRegisterError("");
                }}
                disabled={isLoading}
                autoComplete="new-password"
              />
            </div>
            {confirmPasswordError && (
              <p className="form-field-error">{confirmPasswordError}</p>
            )}
          </div>

          {/* Submit Button */}
          <button type="submit" className="btn-auth-submit" disabled={isLoading}>
            {isLoading ? (
              <span className="btn-spinner-content">
                <span className="spinner-dots"></span> Creating Account...
              </span>
            ) : (
              "Create Account"
            )}
          </button>
        </form>

        {/* Footer Link */}
        <div className="auth-card-footer">
          <p>
            Already have an account?{" "}
            <Link to="/login" className="auth-switch-link">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}

export default Register;