import { useState } from "react";
import { ArrowLeft, ArrowRight, BookOpen, Eye, EyeOff, ShieldCheck, User } from "lucide-react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import Logo from "../components/Logo";
import { useAuth } from "../App";

export default function CustomerAuth() {
  const { user, login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isSignup = location.pathname === "/signup";
  const [mode, setMode] = useState(isSignup ? "register" : "login");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [fields, setFields] = useState({ email: "", password: "" });

  // If already logged in, redirect appropriately
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
      const formData = new FormData(event.currentTarget);
      const signedInUser =
        mode === "login"
          ? await login(Object.fromEntries(formData))
          : await register(Object.fromEntries(formData));

      // Only allow customer role through this portal
      if (signedInUser.role === "admin") {
        navigate("/admin");
      } else if (signedInUser.role === "staff") {
        navigate("/staff");
      } else {
        navigate("/account");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-visual">
        <img src="/hero-interior.png" alt="" />
        <div className="auth-shade" />
        <Logo />
        <div className="auth-quote">
          <p>"Good design makes room for life."</p>
          <span>Design Harmony · Hyderabad</span>
        </div>
      </section>

      <section className="auth-panel">
        <Link className="auth-back" to="/">
          <ArrowLeft size={17} /> Back to website
        </Link>

        <div className="auth-box">
          {/* Role badge */}
          <div className="auth-role-badge">
            <User size={14} />
            <span>Customer Portal</span>
          </div>

          {mode === "register" ? (
            <>
              <span className="eyebrow">Sign up &amp; book</span>
              <h1>Create your account.</h1>
              <p>Register below, then book your consultation and continue the conversation on WhatsApp.</p>

              <form className="auth-form" onSubmit={submit}>
                <label>
                  <span>Full name</span>
                  <input required name="name" placeholder="Your full name" />
                </label>
                <label>
                  <span>Mobile number</span>
                  <input required name="phone" type="tel" pattern="[0-9]{10}" placeholder="10-digit number" />
                </label>
                <label>
                  <span>Email address</span>
                  <input required name="email" type="email" placeholder="you@example.com" />
                </label>
                <label>
                  <span>Password</span>
                  <div className="password-field">
                    <input required name="password" type={show ? "text" : "password"} placeholder="Choose a password" />
                    <button type="button" onClick={() => setShow(!show)}>
                      {show ? <EyeOff /> : <Eye />}
                    </button>
                  </div>
                </label>
                {error && <p className="form-message error">{error}</p>}
                <button className="button button--dark" disabled={busy}>
                  {busy ? "Creating account…" : "Create account & book"} <ArrowRight size={17} />
                </button>
              </form>

              {/* Login link removed per user request */}
            </>
          ) : (
            <>
              <span className="eyebrow">Customer sign in</span>
              <h1>Welcome back.</h1>
              <p>Sign in to view your project, track progress, and manage your bookings.</p>

              <form className="auth-form" onSubmit={submit}>
                <label>
                  <span>Email address</span>
                  <input
                    required
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    value={fields.email}
                    onChange={(e) => setFields({ ...fields, email: e.target.value })}
                  />
                </label>
                <label>
                  <span>Password</span>
                  <div className="password-field">
                    <input
                      required
                      name="password"
                      type={show ? "text" : "password"}
                      placeholder="Your password"
                      value={fields.password}
                      onChange={(e) => setFields({ ...fields, password: e.target.value })}
                    />
                    <button type="button" onClick={() => setShow(!show)}>
                      {show ? <EyeOff /> : <Eye />}
                    </button>
                  </div>
                </label>
                {error && <p className="form-message error">{error}</p>}
                <button className="button button--dark" disabled={busy}>
                  {busy ? "Signing in…" : "Sign in"} <ArrowRight size={17} />
                </button>
              </form>

              <button
                className="auth-mode"
                onClick={() => { setMode("register"); navigate("/signup", { replace: true }); }}
              >
                New customer? Create an account &amp; book
              </button>
            </>
          )}

          <div className="auth-secure">
            <ShieldCheck size={16} />
            <span>
              <BookOpen size={13} style={{ display: "inline", marginRight: 4 }} />
              Customers book &amp; track projects here.
            </span>
          </div>
        </div>
      </section>
    </main>
  );
}
