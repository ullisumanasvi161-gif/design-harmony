import { useState } from "react";
import { ArrowRight, Eye, EyeOff, Lock, ShieldAlert } from "lucide-react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import Logo from "../components/Logo";
import { useAuth } from "../App";

export default function AdminAuth() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [fields, setFields] = useState({
    email: "",
    password: ""
  });

  if (user) {
    if (user.role === "admin") return <Navigate to="/admin" replace />;
    if (user.role === "staff") return <Navigate to="/staff" replace />;
    return <Navigate to="/account" replace />;
  }

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const signedInUser = await login(fields);
      if (signedInUser.role !== "admin") {
        setError("Access denied. This portal is for admin users only.");
        // Force logout since they authenticated but aren't admin
        return;
      }
      navigate("/admin");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-page auth-page--admin">
      {/* Left visual panel */}
      <section className="auth-visual auth-visual--admin">
        <img src="/hero-interior.png" alt="" />
        <div className="auth-shade auth-shade--dark" />
        <Logo />
        <div className="auth-quote">
          <p>"Manage every detail of the studio from one secure place."</p>
          <span>Design Harmony · Admin Portal</span>
        </div>
      </section>

      {/* Right login panel */}
      <section className="auth-panel auth-panel--admin">
        <Link className="auth-back auth-back--admin" to="/">
          ← Back to website
        </Link>

        <div className="auth-box auth-box--admin">
          <div className="admin-portal-badge">
            <Lock size={14} />
            <span>Admin Portal · Restricted Access</span>
          </div>

          <span className="eyebrow eyebrow--admin">Secure sign in</span>
          <h1>Admin Dashboard</h1>
          <p>Only authorised Design Harmony administrators can access this portal.</p>

          <form className="auth-form" onSubmit={submit}>
            <label>
              <span>Admin email</span>
              <input
                required
                name="dh_admin_email"
                type="email"
                placeholder="admin@designharmony.com"
                autoComplete="new-email"
                value={fields.email}
                onChange={(e) => setFields({ ...fields, email: e.target.value })}
              />
            </label>
            <label>
              <span>Password</span>
              <div className="password-field">
                <input
                  required
                  name="dh_admin_password"
                  type={show ? "text" : "password"}
                  placeholder="Admin password"
                  autoComplete="new-password"
                  value={fields.password}
                  onChange={(e) => setFields({ ...fields, password: e.target.value })}
                />
                <button type="button" onClick={() => setShow(!show)}>
                  {show ? <EyeOff /> : <Eye />}
                </button>
              </div>
            </label>

            {error && (
              <div className="form-message error admin-error">
                <ShieldAlert size={15} />
                {error}
              </div>
            )}

            <button className="button button--admin-login" disabled={busy}>
              {busy ? "Verifying…" : "Sign in to Admin Portal"} <ArrowRight size={17} />
            </button>
          </form>

          <div className="auth-admin-footer">
            <div className="auth-secure">
              <Lock size={14} /> Secure admin session · Role-verified access
            </div>
            <div className="auth-portal-links">
              <Link to="/staff/login" className="auth-portal-link">Staff portal</Link>
              &nbsp;·&nbsp;
              <Link to="/login" className="auth-portal-link">Customer login</Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
