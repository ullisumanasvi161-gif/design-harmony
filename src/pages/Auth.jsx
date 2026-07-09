import { useState } from "react";
import { ArrowLeft, ArrowRight, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import Logo from "../components/Logo";
import { useAuth } from "../App";

const demos = {
  admin: ["admin@designharmony.com", "admin123"],
  staff: ["staff@designharmony.com", "staff123"]
};

export default function Auth() {
  const { user, login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mode, setMode] = useState(new URLSearchParams(location.search).get("mode") === "register" ? "register" : "login");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [credentials, setCredentials] = useState({ email: demos.admin[0], password: demos.admin[1] });
  if (user) return <Navigate to={["admin", "staff"].includes(user.role) ? "/portal" : "/consultation"} replace />;

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const signedInUser = mode === "login"
        ? await login(credentials)
        : await register(Object.fromEntries(new FormData(event.currentTarget)));
      navigate(["admin", "staff"].includes(signedInUser.role) ? "/portal" : "/consultation");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  function useDemo(role) {
    setMode("login");
    setCredentials({ email: demos[role][0], password: demos[role][1] });
  }

  return (
    <main className="auth-page">
      <section className="auth-visual">
        <img src="/hero-interior.png" alt="" />
        <div className="auth-shade" />
        <Logo />
        <div className="auth-quote">
          <p>“Good design makes room for life.”</p>
          <span>Design Harmony · Hyderabad</span>
        </div>
      </section>
      <section className="auth-panel">
        <Link className="auth-back" to="/"><ArrowLeft size={17} /> Back to website</Link>
        <div className="auth-box">
          <span className="eyebrow">{mode === "login" ? "Team sign in" : "Sign up & book"}</span>
          <h1>{mode === "login" ? "Welcome back." : "Create your account."}</h1>
          <p>{mode === "login" ? "Owner and staff can sign in to manage bookings. Customers can create an account and book directly." : "Register, book your requirement, and continue the conversation on WhatsApp."}</p>
          {mode === "login" && (
            <div className="demo-switch">
            {Object.keys(demos).map((role) => <button type="button" key={role} onClick={() => useDemo(role)}>{role}</button>)}
            </div>
          )}
          <form className="auth-form" onSubmit={submit}>
            {mode === "register" && <>
              <label><span>Full name</span><input required name="name" /></label>
              <label><span>Mobile</span><input required name="phone" pattern="[0-9]{10}" /></label>
            </>}
            <label><span>Email</span><input required name="email" type="email" value={mode === "login" ? credentials.email : undefined} onChange={(e) => setCredentials({ ...credentials, email: e.target.value })} /></label>
            <label><span>Password</span><div className="password-field"><input required name="password" type={show ? "text" : "password"} value={mode === "login" ? credentials.password : undefined} onChange={(e) => setCredentials({ ...credentials, password: e.target.value })} /><button type="button" onClick={() => setShow(!show)}>{show ? <EyeOff /> : <Eye />}</button></div></label>
            {error && <p className="form-message error">{error}</p>}
            <button className="button button--dark" disabled={busy}>{busy ? "Please wait…" : mode === "login" ? "Sign in" : "Register"} <ArrowRight size={17} /></button>
          </form>
          <button className="auth-mode" onClick={() => setMode(mode === "login" ? "register" : "login")}>
            {mode === "login" ? "New customer? Create an account & book" : "Already registered? Sign in"}
          </button>
          <div className="auth-secure"><ShieldCheck size={16} /> Customers book directly. Team members use the dashboard.</div>
        </div>
      </section>
    </main>
  );
}
