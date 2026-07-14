import { useState } from "react";
import { ArrowRight, Eye, EyeOff, HardHat, ShieldAlert } from "lucide-react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import Logo from "../components/Logo";
import { useAuth } from "../App";

export default function StaffAuth() {
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
    if (user.role === "staff") return <Navigate to="/staff" replace />;
    if (user.role === "admin") return <Navigate to="/admin" replace />;
    return <Navigate to="/account" replace />;
  }

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const signedInUser = await login(fields);
      if (signedInUser.role !== "staff" && signedInUser.role !== "admin") {
        setError("Access denied. This portal is for Design Harmony staff only.");
        return;
      }
      navigate(signedInUser.role === "admin" ? "/admin" : "/staff");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-page auth-page--staff">
      {/* Left visual */}
      <section className="auth-visual auth-visual--staff">
        <img src="/hero-interior.png" alt="" />
        <div className="auth-shade auth-shade--staff" />
        <Logo />
        <div className="auth-quote">
          <p>"Your projects, tasks and work updates — all in one place."</p>
          <span>Design Harmony · Staff Workspace</span>
        </div>
      </section>

      {/* Right login panel */}
      <section className="auth-panel auth-panel--staff">
        <Link className="auth-back auth-back--staff" to="/">
          ← Back to website
        </Link>

        <div className="auth-box auth-box--staff">
          <div className="staff-portal-badge">
            <HardHat size={14} />
            <span>Staff Workspace · Team Only</span>
          </div>

          <span className="eyebrow eyebrow--staff">Team sign in</span>
          <h1>Staff Portal</h1>
          <p>Access your assigned projects, tasks, and work update tools.</p>

          <form className="auth-form" onSubmit={submit}>
            <label>
              <span>Staff email</span>
              <input
                required
                name="dh_staff_email"
                type="email"
                placeholder="staff@designharmony.com"
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
                  name="dh_staff_password"
                  type={show ? "text" : "password"}
                  placeholder="Staff password"
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
              <div className="form-message error staff-error">
                <ShieldAlert size={15} />
                {error}
              </div>
            )}

            <button className="button button--staff-login" disabled={busy}>
              {busy ? "Verifying…" : "Sign in to Staff Portal"} <ArrowRight size={17} />
            </button>
          </form>

          <div className="auth-staff-footer">
            <div className="auth-secure">
              <HardHat size={14} /> Verified team access only
            </div>
            <div className="auth-portal-links">
              <Link to="/admin/login" className="auth-portal-link">Admin portal</Link>
              &nbsp;·&nbsp;
              <Link to="/login" className="auth-portal-link">Customer login</Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
