import { useEffect, useState } from "react";
import {
  Bell, CalendarDays, CheckCircle2, ChevronRight, Download,
  Home, LayoutDashboard, LogOut, Menu, MessageSquare, Star, X,
  Palette, CreditCard, Inbox
} from "lucide-react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import Logo from "../components/Logo";
import { useAuth } from "../App";
import { api } from "../api";

const money = (value) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);

const customerNav = [
  [LayoutDashboard, "Overview"],
  [CalendarDays, "My project"],
  [Palette, "Designs & quote"],
  [CreditCard, "Payments"],
  [Inbox, "Messages"]
];

function Status({ children }) {
  const key = String(children).toLowerCase().replaceAll(" ", "-");
  return <span className={`status status--${key}`}>{children}</span>;
}

function PanelHead({ title, action }) {
  return (
    <header className="panel-head">
      <h2>{title}</h2>
      {action && <button>{action} <ChevronRight size={15} /></button>}
    </header>
  );
}

/** Reusable empty state shown per-tab when no project exists */
function EmptyTabState({ icon: Icon, title, message, cta, ctaLink }) {
  return (
    <div className="customer-tab-empty">
      <div className="customer-tab-empty__icon"><Icon size={40} /></div>
      <h3>{title}</h3>
      <p>{message}</p>
      {cta && <Link className="button button--dark" to={ctaLink}>{cta}</Link>}
    </div>
  );
}

export default function CustomerAccount() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState("Overview");
  const [error, setError] = useState("");

  const load = () => api.dashboard().then(setData).catch((err) => setError(err.message));

  useEffect(() => { load(); }, []);

  // Role guards
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === "admin") return <Navigate to="/admin" replace />;
  if (user.role === "staff") return <Navigate to="/staff" replace />;

  if (!data) {
    return (
      <div className="portal-loading">
        <Logo />
        <span>{error || "Loading your account…"}</span>
      </div>
    );
  }

  const project = data.projects[0];
  const payment = data.payments[0];
  const firstName = user.name ? user.name.split(" ")[0] : "there";

  function handleLogout() {
    logout();
    navigate("/", { replace: true });
  }

  async function invoice() {
    if (!project?.id) return;
    const details = await api.invoice(project.id);
    const text = `DESIGN HARMONY\nInvoice ${details.invoice}\nProject: ${details.project}\nCustomer: ${details.customer}\nTotal: ${money(details.total)}\nStatus: ${details.status}`;
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${details.invoice}.txt`; a.click();
    URL.revokeObjectURL(url);
  }

  // ── Tab content renderer — each tab handles its own empty state ──
  function renderTab() {
    switch (tab) {

      // ── OVERVIEW ──────────────────────────────────────────────────
      case "Overview":
        if (!project) {
          return (
            <div className="customer-welcome">
              <div className="customer-welcome__card">
                <span className="eyebrow">Getting started</span>
                <h2>Welcome to Design Harmony, {firstName}.</h2>
                <p>Your personal space to track projects, review designs, and stay in sync with your designer. Book a consultation to get started.</p>
                <div className="customer-welcome__actions">
                  <Link className="button button--dark" to="/consultation">Book a free consultation →</Link>
                  <Link className="button button--outline" to="/services">Explore services</Link>
                </div>
              </div>
              <div className="customer-welcome__steps">
                {[
                  ["01", "Book a consultation", "Tell us about your space and requirements."],
                  ["02", "Design begins", "Our team creates a custom plan for your home."],
                  ["03", "Track live progress", "Monitor every milestone from this portal."]
                ].map(([n, t, d]) => (
                  <div className="welcome-step" key={n}>
                    <span>{n}</span>
                    <strong>{t}</strong>
                    <p>{d}</p>
                  </div>
                ))}
              </div>
            </div>
          );
        }
        return (
          <>
            <section className="customer-hero">
              <img src={project.image} alt={project.name} />
              <div className="customer-overlay" />
              <div>
                <Status>{project.status}</Status>
                <h2>{project.name}</h2>
                <p>{project.category} · {project.location}</p>
              </div>
              <div className="customer-progress">
                <strong>{project.progress}%</strong>
                <span>Complete</span>
                <i><b style={{ width: `${project.progress}%` }} /></i>
              </div>
            </section>
            <div className="portal-grid customer-grid">
              <section className="panel panel--wide">
                <PanelHead title="Project timeline" />
                <div className="timeline">
                  {[
                    ["Design approved", "Completed", true],
                    ["Civil & electrical", "Completed", true],
                    ["Kitchen installation", "In progress", true],
                    ["Wardrobes & storage", "Up next", false],
                    ["Styling & handover", "July 30", false]
                  ].map(([title, label, done], i) => (
                    <div className={done ? "done" : ""} key={title}>
                      <i>{done ? <CheckCircle2 /> : i + 1}</i>
                      <strong>{title}</strong>
                      <span>{label}</span>
                    </div>
                  ))}
                </div>
              </section>
              <section className="panel designer-card">
                <PanelHead title="Your designer" />
                <span className="designer-avatar">AR</span>
                <h3>{project.designer}</h3>
                <p>Senior Interior Designer</p>
                <button><MessageSquare size={17} /> Send a message</button>
              </section>
              <section className="panel panel--wide">
                <PanelHead title="Latest from site" action="All updates" />
                {data.updates.length > 0 ? data.updates.map((u) => (
                  <div className="site-update" key={u.id}>
                    <span>{u.date}</span>
                    <p>{u.note}</p>
                  </div>
                )) : <p style={{ color: "var(--muted)", fontSize: 13, paddingTop: 12 }}>No updates yet.</p>}
              </section>
              <section className="panel payment-card">
                <PanelHead title="Payment" />
                <span>Project value</span>
                <h3>{money(project.budget)}</h3>
                <div>
                  <Status>{payment?.status || "pending"}</Status>
                  <b>{money(payment?.amount || 0)} paid</b>
                </div>
                <button onClick={invoice}><Download size={17} /> Download invoice</button>
              </section>
            </div>
          </>
        );

      // ── MY PROJECT ────────────────────────────────────────────────
      case "My project":
        if (!project) {
          return (
            <EmptyTabState
              icon={CalendarDays}
              title="No active project yet"
              message="Once your consultation is complete, your project timeline will appear here."
              cta="Book a consultation"
              ctaLink="/consultation"
            />
          );
        }
        return (
          <div className="portal-grid" style={{ gridTemplateColumns: "1.5fr 1fr" }}>
            <section className="panel panel--wide">
              <PanelHead title="Project timeline" />
              <div className="timeline">
                {[
                  ["Design approved", "Completed", true],
                  ["Civil & electrical", "Completed", true],
                  ["Kitchen installation", "In progress", true],
                  ["Wardrobes & storage", "Up next", false],
                  ["Styling & handover", "July 30", false]
                ].map(([title, label, done], i) => (
                  <div className={done ? "done" : ""} key={title}>
                    <i>{done ? <CheckCircle2 /> : i + 1}</i>
                    <strong>{title}</strong>
                    <span>{label}</span>
                  </div>
                ))}
              </div>
            </section>
            <section className="panel">
              <PanelHead title="Latest from site" action="All updates" />
              {data.updates.map((u) => (
                <div className="site-update" key={u.id}>
                  <span>{u.date}</span>
                  <p>{u.note}</p>
                </div>
              ))}
            </section>
          </div>
        );

      // ── DESIGNS & QUOTE ───────────────────────────────────────────
      case "Designs & quote":
        if (!project) {
          return (
            <EmptyTabState
              icon={Palette}
              title="No designs yet"
              message="Your 3D previews, mood boards and design proposals from our team will show up here once your project starts."
              cta="Start your project"
              ctaLink="/consultation"
            />
          );
        }
        return (
          <div className="portal-grid" style={{ gridTemplateColumns: "1fr" }}>
            <section className="panel panel--wide design-preview">
              <img src="/bedroom.png" alt="Design preview" />
              <div>
                <span className="eyebrow">New design preview</span>
                <h3>Primary bedroom · Option B</h3>
                <p>Ready for your comments and material approval.</p>
                <button className="button button--dark">Open 3D preview</button>
              </div>
            </section>
          </div>
        );

      // ── PAYMENTS ──────────────────────────────────────────────────
      case "Payments":
        if (!project) {
          return (
            <EmptyTabState
              icon={CreditCard}
              title="No payment records yet"
              message="Your invoices and payment history will appear here once your project is underway."
              cta="Book a consultation"
              ctaLink="/consultation"
            />
          );
        }
        return (
          <div className="portal-grid" style={{ gridTemplateColumns: "1fr" }}>
            <section className="panel payment-card">
              <PanelHead title="Payment Details" />
              <span>Project value</span>
              <h3>{money(project.budget)}</h3>
              <div>
                <Status>{payment?.status || "pending"}</Status>
                <b>{money(payment?.amount || 0)} paid</b>
              </div>
              <button onClick={invoice}><Download size={17} /> Download invoice</button>
            </section>
          </div>
        );

      // ── MESSAGES ──────────────────────────────────────────────────
      case "Messages":
        if (!project) {
          return (
            <EmptyTabState
              icon={Inbox}
              title="No messages yet"
              message="Once your project is active, you can communicate with your designer and share feedback here."
              cta="Explore our services"
              ctaLink="/services"
            />
          );
        }
        return (
          <div className="portal-grid" style={{ gridTemplateColumns: "1.2fr 0.8fr" }}>
            <section className="panel feedback">
              <Star />
              <h3>How are we doing?</h3>
              <p>Your feedback helps us shape a better experience.</p>
              <button>Share feedback</button>
            </section>
            <section className="panel designer-card">
              <PanelHead title="Your designer" />
              <span className="designer-avatar">AR</span>
              <h3>{project.designer}</h3>
              <p>Senior Interior Designer</p>
              <button><MessageSquare size={17} /> Send a message</button>
            </section>
          </div>
        );

      default:
        return null;
    }
  }

  return (
    <div className="portal portal--customer">
      {/* Sidebar */}
      <aside className={open ? "portal-side portal-side--customer open" : "portal-side portal-side--customer"}>
        <div className="side-head">
          <Logo compact />
          <button onClick={() => setOpen(false)}><X /></button>
        </div>
        <div className="role-chip role-chip--customer">my account</div>
        <nav>
          {customerNav.map(([Icon, label], index) => (
            <button
              className={tab === label ? "active" : ""}
              key={label}
              onClick={() => { setTab(label); setOpen(false); }}
            >
              <Icon size={19} /> {label}
            </button>
          ))}
        </nav>
        <div className="side-bottom">
          <Link to="/consultation"><CalendarDays size={19} /> Book a service</Link>
          <Link to="/"><Home size={19} /> Back to website</Link>
          <button id="customer-signout-btn" onClick={handleLogout}><LogOut size={19} /> Sign out</button>
        </div>
      </aside>

      {/* Main */}
      <div className="portal-main">
        <header className="portal-topbar portal-topbar--customer">
          <button className="portal-menu" onClick={() => setOpen(true)}><Menu /></button>
          <div className="portal-brand-center"><Logo compact /></div>
          <div className="portal-user portal-user--customer">
            <button className="notification"><Bell size={19} /><i /></button>
            <span className="user-avatar user-avatar--customer">
              {user.avatar || user.name?.slice(0, 2).toUpperCase()}
            </span>
            <div className="user-info">
              <strong>{user.name}</strong>
              <small>Customer</small>
            </div>
            <button className="customer-signout-topbar" onClick={handleLogout} title="Sign out">
              <LogOut size={16} />
              <span>Sign out</span>
            </button>
          </div>
        </header>

        <main className="portal-content">
          <div className="portal-heading portal-heading--customer">
            <div>
              <span>{new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}</span>
              <h1>Welcome back, {firstName}.</h1>
              <p>Track your project, review designs and stay connected with our team.</p>
            </div>
            <Link className="button button--dark" to="/consultation">+ Book a service</Link>
          </div>

          {renderTab()}
        </main>
      </div>
    </div>
  );
}
