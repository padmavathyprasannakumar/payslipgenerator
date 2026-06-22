import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginUser, registerUser } from "../services/api";

const fallbackLogo = "/logo.png";

export default function AuthPage({ mode, onAuthSuccess, company }) {
  const isSignup = mode === "signup";
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", email: "", password: "", password2: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const logoSrc = company?.logo_url || fallbackLogo;
  const companyName = company?.company_name || "Vetri Technology Solutions";

  const handleImageError = (event) => {
    event.currentTarget.src = fallbackLogo;
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const formatError = (err) => {
    const data = err.response?.data;
    if (!data) return "Something went wrong. Please try again.";
    if (typeof data === "string") return data;
    if (data.non_field_errors) return data.non_field_errors.join(" ");
    return Object.entries(data)
      .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(" ") : value}`)
      .join(" | ");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const payload = isSignup
        ? form
        : { username: form.username, password: form.password };
      const res = isSignup ? await registerUser(payload) : await loginUser(payload);
      onAuthSuccess(res.data);
      navigate("/");
    } catch (err) {
      setError(formatError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <div className="auth-card">
        <div className="auth-left">
          <img src={logoSrc} onError={handleImageError} alt={`${companyName} Logo`} />
          <h2>{isSignup ? "Create Account" : "Welcome Back"}</h2>
          <p>
            {isSignup
              ? "Signup to create, edit, save, and download employee payslips."
              : "Login to manage your payslip generator dashboard."}
          </p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <h2>{isSignup ? "Signup" : "Login"}</h2>
          {error && <div className="error-box">{error}</div>}

          <label>Username</label>
          <input name="username" value={form.username} onChange={handleChange} placeholder="Enter username" required />

          {isSignup && (
            <>
              <label>Email</label>
              <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="Enter email" />
            </>
          )}

          <label>Password</label>
          <input type="password" name="password" value={form.password} onChange={handleChange} placeholder="Enter password" required />

          {isSignup && (
            <>
              <label>Confirm Password</label>
              <input type="password" name="password2" value={form.password2} onChange={handleChange} placeholder="Confirm password" required />
            </>
          )}

          <button className="submit-btn" type="submit" disabled={loading}>
            {loading ? "Please wait..." : isSignup ? "Signup" : "Login"}
          </button>

          <p className="switch-auth">
            {isSignup ? "Already have an account? " : "Do not have an account? "}
            <Link to={isSignup ? "/login" : "/signup"}>{isSignup ? "Login" : "Signup"}</Link>
          </p>
        </form>
      </div>
    </main>
  );
}
