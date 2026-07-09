import { useEffect, useState } from "react";
import {
  Bell, BriefcaseBusiness, CheckCircle2, ChevronRight, ClipboardCheck,
  Home, LayoutDashboard, LogOut, Menu, MessageSquare, Upload, X
} from "lucide-react";
import { Link, Navigate } from "react-router-dom";
import Logo from "../components/Logo";
import { useAuth } from "../App";
import { api } from "../api";

const staffNav = [
  [LayoutDashboard, "Overview"],
  [BriefcaseBusiness, "My projects"],
  [ClipboardCheck, "Tasks"],
  [Upload, "Work updates"],
  [MessageSquare, "Notes"]
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

export default function StaffPortal() {
  const { user, logout } = useAuth();
  const [data, setData] = useState(null);
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState("Overview");
  const [error, setError] = useState("");
  const [note, setNote] = useState("");

  const load = () => api.dashboard().then(setData).catch((err) => setError(err.message));

  useEffect(() => {
    load();
  }, []);

  if (!user || (user.role !== "staff" && user.role !== "admin")) {
    return <Navigate to="/staff/login" replace />;
  }

  if (!data) {
    return (
      <div className="portal-loading portal-loading--staff">
        <Logo />
        <span>{error || "Preparing your workspace…"}</span>
      </div>
    );
  }

  function handleLogout() {
    logout();
    window.location.href = "/staff/login";
  }

  const active = data.projects[0];

  async function addNote(event) {
    event.preventDefault();
    if (!note.trim()) return;
    await api.addUpdate({ projectId: active.id, author: user.name || "Staff", note });
    setNote("");
    load();
  }

  const firstName = user.name ? user.name.split(" ")[0] : "Team";

  return (
    <div className="portal portal--staff">
      <aside className={open ? "portal-side portal-side--staff open" : "portal-side portal-side--staff"}>
        <div className="side-head">
          <Logo compact />
          <button onClick={() => setOpen(false)}><X /></button>
        </div>
        <div className="role-chip role-chip--staff">staff workspace</div>
        <nav>
          {staffNav.map(([Icon, label], index) => (
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
          <Link to="/"><Home size={19} /> Website</Link>
          <button onClick={handleLogout}><LogOut size={19} /> Sign out</button>
        </div>
      </aside>

      <div className="portal-main">
        <header className="portal-topbar portal-topbar--staff">
          <button className="portal-menu" onClick={() => setOpen(true)}><Menu /></button>
          <div className="portal-user">
            <button className="notification"><Bell size={19} /><i /></button>
            <span className="user-avatar user-avatar--staff">{user.avatar || user.name?.slice(0, 2).toUpperCase()}</span>
            <div><strong>{user.name}</strong><small>{user.title || "Staff"}</small></div>
          </div>
        </header>

        <main className="portal-content">
          <div className="portal-heading">
            <div>
              <span>{new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}</span>
              <h1>Good morning, {firstName}</h1>
              <p>Your projects, priorities and latest updates in one place.</p>
            </div>
          </div>

          {tab === "My projects" && (
            <div className="portal-grid" style={{ gridTemplateColumns: "1fr" }}>
              <section className="panel panel--wide">
                <PanelHead title="Assigned projects" />
                {data.projects.map((project) => (
                  <div className="staff-project" key={project.id} style={{ borderBottom: "1px solid var(--line)", paddingBottom: "20px", marginBottom: "20px" }}>
                    <img src={project.image} />
                    <div>
                      <Status>{project.status}</Status>
                      <h3>{project.name}</h3>
                      <p>{project.customer} · {project.location}</p>
                      <div className="bar"><i style={{ width: `${project.progress}%` }} /></div>
                      <small>{project.progress}% complete · Next: {project.nextMilestone}</small>
                    </div>
                  </div>
                ))}
              </section>
            </div>
          )}

          {tab === "Tasks" && (
            <div className="portal-grid" style={{ gridTemplateColumns: "1fr" }}>
              <section className="panel">
                <PanelHead title="Today's tasks list" />
                {data.tasks.map((task) => (
                  <label className="task" key={task.id}>
                    <input type="checkbox" defaultChecked={task.status === "completed"} />
                    <span><strong>{task.title}</strong><small>{task.due} · {task.priority}</small></span>
                  </label>
                ))}
              </section>
            </div>
          )}

          {tab === "Work updates" && (
            <div className="portal-grid" style={{ gridTemplateColumns: "1fr" }}>
              <section className="panel panel--wide">
                <PanelHead title="Daily work update" />
                <form className="update-form" onSubmit={addNote}>
                  <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="What moved forward on site today?" />
                  <div>
                    <button type="button"><Upload size={16} /> Add photos</button>
                    <button className="button button--dark">Post update</button>
                  </div>
                </form>
              </section>
            </div>
          )}

          {tab === "Notes" && (
            <div className="portal-grid" style={{ gridTemplateColumns: "1fr" }}>
              <section className="panel">
                <PanelHead title="Recent notes log" />
                {data.updates.map((update) => (
                  <div className="note" key={update.id}>
                    <span>{update.date.slice(5).replace("-", "/")}</span>
                    <p>{update.note}</p>
                  </div>
                ))}
              </section>
            </div>
          )}

          {tab === "Overview" && (
            <>
              <div className="stat-grid stat-grid--three">
                <article className="stat-card">
                  <div><BriefcaseBusiness /></div>
                  <span>Assigned projects</span>
                  <strong>{data.projects.length}</strong>
                  <small>1 site visit today</small>
                </article>
                <article className="stat-card">
                  <div><ClipboardCheck /></div>
                  <span>Open tasks</span>
                  <strong>{data.tasks.filter((t) => t.status !== "completed").length}</strong>
                  <small>1 high priority</small>
                </article>
                <article className="stat-card">
                  <div><CheckCircle2 /></div>
                  <span>Average progress</span>
                  <strong>{Math.round(data.projects.reduce((sum, p) => sum + p.progress, 0) / Math.max(data.projects.length, 1))}%</strong>
                  <small>On schedule</small>
                </article>
              </div>
              <div className="portal-grid">
                <section className="panel panel--wide">
                  <PanelHead title="Assigned projects" />
                  {data.projects.map((project) => (
                    <div className="staff-project" key={project.id}>
                      <img src={project.image} />
                      <div>
                        <Status>{project.status}</Status>
                        <h3>{project.name}</h3>
                        <p>{project.customer} · {project.location}</p>
                        <div className="bar"><i style={{ width: `${project.progress}%` }} /></div>
                        <small>{project.progress}% complete · Next: {project.nextMilestone}</small>
                      </div>
                    </div>
                  ))}
                </section>
                <section className="panel">
                  <PanelHead title="Today's tasks" />
                  {data.tasks.map((task) => (
                    <label className="task" key={task.id}>
                      <input type="checkbox" defaultChecked={task.status === "completed"} />
                      <span><strong>{task.title}</strong><small>{task.due} · {task.priority}</small></span>
                    </label>
                  ))}
                </section>
                <section className="panel panel--wide">
                  <PanelHead title="Daily work update" />
                  <form className="update-form" onSubmit={addNote}>
                    <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="What moved forward on site today?" />
                    <div>
                      <button type="button"><Upload size={16} /> Add photos</button>
                      <button className="button button--dark">Post update</button>
                    </div>
                  </form>
                </section>
                <section className="panel">
                  <PanelHead title="Recent notes" />
                  {data.updates.slice(0, 3).map((update) => (
                    <div className="note" key={update.id}>
                      <span>{update.date.slice(5).replace("-", "/")}</span>
                      <p>{update.note}</p>
                    </div>
                  ))}
                </section>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
