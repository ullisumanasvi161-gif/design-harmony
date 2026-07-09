import { useEffect, useMemo, useState } from "react";
import {
  Bell, CalendarDays, CheckCircle2, ChevronRight, Download,
  Home, LayoutDashboard, LogOut, Menu, MessageSquare, Star, X
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
  [MessageSquare, "Designs & quote"],
  [Download, "Payments"],
  [Star, "Messages"]
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

export default function CustomerAccount() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState("Overview");
  const [error, setError] = useState("");

  const load = () => api.dashboard().then(setData).catch((err) => setError(err.message));

  useEffect(() => {
    load();
  }, []);

  // Only customers can access this portal
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === "admin") return <Navigate to="/admin" replace />;
  if (user.role === "staff") return <Navigate to="/staff" replace />;

  if (!data) {
    return (
      <div className="portal-loading portal-loading--customer">
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
    const link = document.createElement("a");
    link.href = url;
    link.download = `${details.invoice}.txt`;
    link.click();
    URL.revokeObjectURL(url);
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
              className={tab === label || (index === 0 && tab === "Overview") ? "active" : ""}
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

      {/* Main content */}
      <div className="portal-main">
        <header className="portal-topbar portal-topbar--customer">
          <button className="portal-menu" onClick={() => setOpen(true)}><Menu /></button>
          <div className="portal-brand-center">
            <Logo compact />
          </div>
          <div className="portal-user portal-user--customer">
            <button className="notification"><Bell size={19} /><i /></button>
            <span className="user-avatar user-avatar--customer">{user.avatar || user.name?.slice(0, 2).toUpperCase()}</span>
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

          {/* No project yet fallback */}
          {!project ? (
            <div className="no-project-state">
              <div className="no-project-card">
                <CalendarDays size={48} />
                <h2>No active project yet</h2>
                <p>Book a consultation and our team will get in touch to start planning your space.</p>
                <Link className="button button--dark" to="/consultation">Book your first consultation</Link>
              </div>
            </div>
          ) : (
            <>
              {tab === "My project" && (
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
                    {data.updates.map((update) => (
                      <div className="site-update" key={update.id}>
                        <span>{update.date}</span>
                        <p>{update.note}</p>
                      </div>
                    ))}
                  </section>
                </div>
              )}

              {tab === "Designs & quote" && (
                <div className="portal-grid" style={{ gridTemplateColumns: "1fr" }}>
                  <section className="panel panel--wide design-preview">
                    <img src="/bedroom.png" />
                    <div>
                      <span className="eyebrow">New design preview</span>
                      <h3>Primary bedroom · Option B</h3>
                      <p>Ready for your comments and material approval.</p>
                      <button className="button button--dark">Open 3D preview</button>
                    </div>
                  </section>
                </div>
              )}

              {tab === "Payments" && (
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
              )}

              {tab === "Messages" && (
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
              )}

              {tab === "Overview" && (
                <>
                  <section className="customer-hero">
                    <img src={project.image} />
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
                      {data.updates.map((update) => (
                        <div className="site-update" key={update.id}>
                          <span>{update.date}</span>
                          <p>{update.note}</p>
                        </div>
                      ))}
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
                    <section className="panel panel--wide design-preview">
                      <img src="/bedroom.png" />
                      <div>
                        <span className="eyebrow">New design preview</span>
                        <h3>Primary bedroom · Option B</h3>
                        <p>Ready for your comments and material approval.</p>
                        <button className="button button--dark">Open 3D preview</button>
                      </div>
                    </section>
                    <section className="panel feedback">
                      <Star />
                      <h3>How are we doing?</h3>
                      <p>Your feedback helps us shape a better experience.</p>
                      <button>Share feedback</button>
                    </section>
                  </div>
                </>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
