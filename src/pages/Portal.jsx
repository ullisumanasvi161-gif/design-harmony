import { useEffect, useMemo, useState } from "react";
import {
  Bell, BriefcaseBusiness, CalendarDays, CheckCircle2, ChevronRight, CircleDollarSign,
  ClipboardCheck, Download, FileText, Home, LayoutDashboard, LogOut, Menu, MessageSquare,
  Search, Settings, Star, Upload, Users, WalletCards, X
} from "lucide-react";
import { Link, Navigate } from "react-router-dom";
import Logo from "../components/Logo";
import { useAuth } from "../App";
import { api } from "../api";

const money = (value) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);
const digitsOnly = (value = "") => String(value).replace(/\D/g, "");
const phoneLink = (value) => {
  const digits = digitsOnly(value);
  return digits ? `tel:+91${digits.slice(-10)}` : "#";
};
const whatsappLink = (booking) => {
  const digits = digitsOnly(booking.mobile || booking.phone);
  const phone = digits ? `91${digits.slice(-10)}` : "";
  const text = encodeURIComponent(`Hello ${booking.name}, this is Design Harmony. We received your ${booking.projectType} booking and would like to discuss your requirement.`);
  return phone ? `https://wa.me/${phone}?text=${text}` : "#";
};

const roleNav = {
  admin: [[LayoutDashboard, "Overview"], [CalendarDays, "Bookings"], [BriefcaseBusiness, "Projects"], [Upload, "Services"], [Users, "People"], [WalletCards, "Payments"], [MessageSquare, "Messages"], [Settings, "Settings"]],
  staff: [[LayoutDashboard, "Overview"], [BriefcaseBusiness, "My projects"], [ClipboardCheck, "Tasks"], [Upload, "Work updates"], [MessageSquare, "Notes"]]
};

function Status({ children }) {
  const key = String(children).toLowerCase().replaceAll(" ", "-");
  return <span className={`status status--${key}`}>{children}</span>;
}

function BookingContactActions({ booking, onStatus }) {
  const hasPhone = digitsOnly(booking.mobile || booking.phone).length > 0;
  const needsContact = ["new", "pending"].includes(String(booking.status).toLowerCase());

  return (
    <div className="booking-contact-actions">
      <a className={!hasPhone ? "is-disabled" : ""} href={phoneLink(booking.mobile || booking.phone)}>Call</a>
      <a className={!hasPhone ? "is-disabled" : ""} href={whatsappLink(booking)} target="_blank" rel="noreferrer">WhatsApp</a>
      {booking.email && <a href={`mailto:${booking.email}`}>Email</a>}
      {needsContact && <button type="button" onClick={() => onStatus(booking.id, "contacted")}>Mark contacted</button>}
    </div>
  );
}

export default function Portal() {
  const { user, logout } = useAuth();
  const [data, setData] = useState(null);
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState("Overview");
  const [error, setError] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const load = () => api.dashboard().then(setData).catch((err) => setError(err.message));
  const isTeamUser = ["admin", "staff"].includes(user?.role);
  
  useEffect(() => {
    if (isTeamUser) load();
  }, [isTeamUser]);

  const title = useMemo(() => {
    if (!user) return "Welcome";
    if (user.role === "admin") return "Studio overview";
    if (user.role === "staff") return "Good morning, Ananya";
    const firstName = user.name ? user.name.split(" ")[0] : "Guest";
    return `Welcome home, ${firstName}`;
  }, [user]);

  if (!user) {
    return <div className="portal-loading"><Logo /><span>Redirecting you to sign in…</span></div>;
  }

  if (!data) return <div className="portal-loading"><Logo /><span>{error || "Preparing your workspace…"}</span></div>;

  if (!isTeamUser) return <Navigate to="/consultation" replace />;

  const role = user.role;

  return (
    <div className="portal">
      <aside className={open ? "portal-side open" : "portal-side"}>
        <div className="side-head"><Logo compact /><button onClick={() => setOpen(false)}><X /></button></div>
        <div className="role-chip">{role} portal</div>
        <nav>
          {roleNav[role]?.map(([Icon, label], index) => (
            <button className={tab === label || (index === 0 && tab === "Overview") ? "active" : ""} key={label} onClick={() => { setTab(label); setOpen(false); }}>
              <Icon size={19} /> {label}
            </button>
          ))}
        </nav>
        <div className="side-bottom">
          {role === "admin" && <button onClick={() => { setTab("Settings"); setOpen(false); }}><Settings size={19} /> Settings</button>}
          <Link to="/"><Home size={19} /> Website</Link>
          <button onClick={logout}><LogOut size={19} /> Sign out</button>
        </div>
      </aside>
      <div className="portal-main">
        <header className="portal-topbar">
          <button className="portal-menu" onClick={() => setOpen(true)}><Menu /></button>
          <div className="portal-search"><Search size={17} /><input placeholder="Search projects, customers…" /></div>
          <div className="portal-user"><button className="notification"><Bell size={19} /><i /></button><span>{user.avatar}</span><div><strong>{user.name}</strong><small>{user.title || role}</small></div></div>
        </header>
        <main className="portal-content">
          <div className="portal-heading"><div><span>{new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}</span><h1>{title}</h1><p>{role === "admin" ? "Here’s what’s moving across Design Harmony today." : "Your projects, priorities and latest updates in one place."}</p></div>{role === "admin" && <button className="button button--dark" onClick={() => setShowCreateModal(true)}>+ New project</button>}</div>
          {role === "admin" && <Admin data={data} reload={load} tab={tab} />}
          {role === "staff" && <Staff data={data} reload={load} tab={tab} />}
        </main>
      </div>
      {showCreateModal && (
        <CreateProjectModal
          data={data}
          onClose={() => setShowCreateModal(false)}
          onCreated={() => {
            setShowCreateModal(false);
            load();
          }}
        />
      )}
    </div>
  );
}

function Admin({ data, reload, tab }) {
  const pendingCustomers = data.stats.pendingBookings ?? data.bookings.filter((booking) => ["new", "pending"].includes(String(booking.status).toLowerCase())).length;
  const completedCustomers = data.stats.completed ?? data.projects.filter((project) => project.status === "completed").length;
  const pendingPaymentTotal = data.stats.pendingRevenue ?? data.payments.filter((payment) => payment.status === "pending").reduce((sum, payment) => sum + payment.amount, 0);
  const cards = [
    [CircleDollarSign, money(data.stats.revenue), "Revenue earned", `${money(pendingPaymentTotal)} pending`],
    [Users, pendingCustomers, "Pending customers", "Need admin contact"],
    [CheckCircle2, completedCustomers, "Completed customers", "Finished projects"],
    [WalletCards, data.payments.length, "Payment details", `${data.payments.filter((payment) => payment.status === "paid").length} paid records`]
  ];
  async function bookingStatus(id, status) {
    await api.updateBooking(id, { status });
    reload();
  }

  if (tab === "Bookings") {
    return (
      <div className="portal-grid" style={{ gridTemplateColumns: "1fr" }}>
        <section className="panel panel--wide">
          <PanelHead title="All consultation requests" action="View calendar" />
          <div className="booking-list">
            {data.bookings.map((booking) => (
              <article className="admin-booking-card" key={booking.id}>
                <div className="booking-date">
                  <strong>{booking.preferredDate ? new Date(booking.preferredDate).getDate() : "--"}</strong>
                  <span>{booking.preferredDate ? new Date(booking.preferredDate).toLocaleDateString("en", { month: "short" }) : "TBD"}</span>
                </div>
                <div>
                  <strong>{booking.name}</strong>
                  <small>Contact: {booking.mobile || booking.phone || "Not provided"}{booking.email ? ` · ${booking.email}` : ""}</small>
                  <span>{booking.projectType} · {booking.location}</span>
                </div>
                <b>{booking.budget}</b>
                <Status>{booking.status}</Status>
                <BookingContactActions booking={booking} onStatus={bookingStatus} />
              </article>
            ))}
          </div>
        </section>
      </div>
    );
  }

  if (tab === "Projects") {
    return (
      <div className="portal-grid" style={{ gridTemplateColumns: "1fr" }}>
        <section className="panel panel--wide">
          <PanelHead title="All active projects" />
          <div className="project-table">
            {data.projects.map((project) => (
              <div className="project-row" key={project.id}>
                <img src={project.image} />
                <div className="project-name">
                  <strong>{project.name}</strong>
                  <span>{project.customer} · {project.location}</span>
                </div>
                <div className="progress-cell">
                  <span>{project.progress}%</span>
                  <i><b style={{ width: `${project.progress}%` }} /></i>
                </div>
                <Status>{project.status}</Status>
                <ChevronRight />
              </div>
            ))}
          </div>
        </section>
      </div>
    );
  }

  if (tab === "Services") {
    return <ServiceImageManager services={data.services || []} reload={reload} />;
  }

  if (tab === "Settings") {
    return <AdminSettings data={data} reload={reload} />;
  }

  if (tab === "People") {
    return (
      <div className="portal-grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
        <section className="panel">
          <PanelHead title="Staff members" />
          {data.staff.map((person) => (
            <div className="person-row" key={person.id}>
              <span>{person.avatar}</span>
              <div>
                <strong>{person.name}</strong>
                <small>{person.title}</small>
              </div>
              <i className="online" />
            </div>
          ))}
        </section>
        <section className="panel">
          <PanelHead title="Customers" />
          {data.customers.map((person) => (
            <div className="person-row" key={person.id}>
              <span>{person.avatar}</span>
              <div>
                <strong>{person.name}</strong>
                <small>Customer</small>
              </div>
              <i className="online" />
            </div>
          ))}
        </section>
      </div>
    );
  }

  if (tab === "Payments") {
    return (
      <div className="portal-grid" style={{ gridTemplateColumns: "1fr 1.5fr" }}>
        <section className="panel">
          <PanelHead title="Revenue mix" />
          <div className="donut"><div><strong>₹56L</strong><span>Collected</span></div></div>
          <div className="legend"><span><i className="gold" /> Paid</span><span><i className="brown" /> Partial</span><span><i className="grey" /> Pending</span></div>
        </section>
        <section className="panel">
          <PaymentDetailsPanel payments={data.payments} />
        </section>
        <section className="panel">
          <PanelHead title="Recorded payments log" />
          <div style={{ display: "grid", gap: "10px", marginTop: "15px" }}>
            {data.payments.map((payment) => (
              <div key={payment.id} style={{ display: "flex", justifyContent: "space-between", padding: "12px", borderBottom: "1px solid var(--line)" }}>
                <div>
                  <strong>{payment.customer}</strong>
                  <div style={{ fontSize: "10px", color: "var(--muted)" }}>{payment.date}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <strong>{money(payment.amount)}</strong>
                  <div><Status>{payment.status}</Status></div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    );
  }

  if (tab === "Messages") {
    return (
      <div className="portal-grid" style={{ gridTemplateColumns: "1fr" }}>
        <section className="panel" style={{ height: "400px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <PanelHead title="Inbox Messages" />
          <div style={{ textAlign: "center", color: "var(--muted)", margin: "auto" }}>
            <MessageSquare size={48} style={{ color: "var(--gold)", marginBottom: "15px" }} />
            <p>No new messages. Select a project or staff member to start a conversation.</p>
          </div>
        </section>
      </div>
    );
  }

  return (
    <>
      <div className="stat-grid">{cards.map(([Icon, value, label, note]) => <article className="stat-card" key={label}><div><Icon size={20} /></div><span>{label}</span><strong>{value}</strong><small>{note}</small></article>)}</div>
      <div className="portal-grid">
        <section className="panel panel--wide">
          <PanelHead title="Live projects" action="View all" />
          <div className="project-table">
            {data.projects.map((project) => <div className="project-row" key={project.id}><img src={project.image} /><div className="project-name"><strong>{project.name}</strong><span>{project.customer} · {project.location}</span></div><div className="progress-cell"><span>{project.progress}%</span><i><b style={{ width: `${project.progress}%` }} /></i></div><Status>{project.status}</Status><ChevronRight /></div>)}
          </div>
        </section>
        <section className="panel">
          <PanelHead title="Revenue mix" />
          <div className="donut"><div><strong>₹56L</strong><span>Collected</span></div></div>
          <div className="legend"><span><i className="gold" /> Paid</span><span><i className="brown" /> Partial</span><span><i className="grey" /> Pending</span></div>
        </section>
        <section className="panel">
          <PaymentDetailsPanel payments={data.payments} />
        </section>
        <section className="panel panel--wide">
          <PanelHead title="Booked customers to contact" action={`${pendingCustomers} pending`} />
          <div className="booking-list">
            {data.bookings.slice(0, 4).map((booking) => (
              <article className="admin-booking-card" key={booking.id}>
                <div className="booking-date">
                  <strong>{booking.preferredDate ? new Date(booking.preferredDate).getDate() : "--"}</strong>
                  <span>{booking.preferredDate ? new Date(booking.preferredDate).toLocaleDateString("en", { month: "short" }) : "TBD"}</span>
                </div>
                <div>
                  <strong>{booking.name}</strong>
                  <small>Contact: {booking.mobile || booking.phone || "Not provided"}{booking.email ? ` · ${booking.email}` : ""}</small>
                  <span>{booking.projectType} · {booking.location}</span>
                </div>
                <b>{booking.budget}</b>
                <Status>{booking.status}</Status>
                <BookingContactActions booking={booking} onStatus={bookingStatus} />
              </article>
            ))}
          </div>
        </section>
        <section className="panel"><PanelHead title="Team" action={`${data.staff.length} members`} />{data.staff.map((person) => <div className="person-row" key={person.id}><span>{person.avatar}</span><div><strong>{person.name}</strong><small>{person.title}</small></div><i className="online" /></div>)}</section>
      </div>
    </>
  );
}

function PaymentDetailsPanel({ payments }) {
  const paidTotal = payments
    .filter((payment) => ["paid", "partial"].includes(String(payment.status).toLowerCase()))
    .reduce((sum, payment) => sum + payment.amount, 0);
  const pendingTotal = payments
    .filter((payment) => String(payment.status).toLowerCase() === "pending")
    .reduce((sum, payment) => sum + payment.amount, 0);

  return (
    <>
      <PanelHead title="Payment details" action={`${payments.length} records`} />
      <div className="payment-summary-grid">
        <div><span>Earned</span><strong>{money(paidTotal)}</strong></div>
        <div><span>Pending</span><strong>{money(pendingTotal)}</strong></div>
      </div>
      <div className="payment-detail-list">
        {payments.slice(0, 5).map((payment) => (
          <div className="payment-detail-row" key={payment.id}>
            <div>
              <strong>{payment.customer}</strong>
              <small>{payment.date}</small>
            </div>
            <div>
              <strong>{money(payment.amount)}</strong>
              <Status>{payment.status}</Status>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function AdminSettings({ data, reload }) {
  const [saving, setSaving] = useState(false);
  const [savingProject, setSavingProject] = useState("");
  const [message, setMessage] = useState("");
  const [projectMessages, setProjectMessages] = useState({});

  const projectsList = ["Aurelia Residence", "Serein Kitchen", "Nocturne Suite", "Atelier One"];
  const defaultProjectImages = {
    "Aurelia Residence": "/hero-interior.png",
    "Serein Kitchen": "/kitchen.png",
    "Nocturne Suite": "/bedroom.png",
    "Atelier One": "/office.png"
  };

  const projectImages = data.settings?.projectImages || defaultProjectImages;

  async function addService(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const body = new FormData(form);
    setSaving(true);
    setMessage("");
    try {
      await api.createService(body);
      form.reset();
      setMessage("New service added. It is now visible on the Services page.");
      reload();
    } catch (err) {
      setMessage(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleProjectImageUpload(projectName, event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const body = new FormData();
    body.append("projectImage", file);

    setSavingProject(projectName);
    setProjectMessages((prev) => ({ ...prev, [projectName]: "" }));

    try {
      await api.updateProjectImage(projectName, body);
      setProjectMessages((prev) => ({ ...prev, [projectName]: "Updated successfully." }));
      reload();
    } catch (err) {
      setProjectMessages((prev) => ({ ...prev, [projectName]: err.message }));
    } finally {
      setSavingProject("");
    }
  }

  return (
    <>
      <div className="portal-grid" style={{ gridTemplateColumns: "1fr" }}>
        <section className="panel panel--wide">
          <PanelHead title="Settings" action="Admin controls" />
          <div className="settings-grid">
            <form className="settings-card settings-form" onSubmit={addService}>
              <span className="eyebrow">Add service</span>
              <h3>Add a new service</h3>
              <label><span>Service title *</span><input required name="title" placeholder="e.g. False ceiling design" /></label>
              <label><span>Category</span><input name="category" placeholder="Residential / Commercial / Custom" /></label>
              <label><span>Description</span><textarea name="copy" rows="4" placeholder="Short service description for customers." /></label>
              <label><span>Cover picture</span><input name="image" type="file" accept="image/*" /></label>
              {message && <p className={`form-message ${message.includes("added") ? "success" : "error"}`}>{message}</p>}
              <button className="button button--dark" disabled={saving}>{saving ? "Adding service..." : "Add service"}</button>
            </form>
            <div className="settings-card">
              <span className="eyebrow">Picture controls</span>
              <h3>Change website pictures</h3>
              <p>Use the controls below to replace each service cover and add previous-client work photos for customer previews.</p>
              <div className="settings-helper">
                <strong>{data.services?.length || 0}</strong>
                <span>services currently shown on the website</span>
              </div>
            </div>

            <div className="settings-card settings-form">
              <span className="eyebrow">Portfolio Settings</span>
              <h3>Completed Projects Showcase</h3>
              <p>Upload custom cover images for your completed showcase projects displayed on the portfolio and homepage.</p>
              
              <div className="room-paintings-list" style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "15px" }}>
                {projectsList.map((projectName) => {
                  const currentPhoto = projectImages[projectName] || defaultProjectImages[projectName];
                  const isUploading = savingProject === projectName;
                  const hasMessage = !!projectMessages[projectName];
                  const isSuccess = projectMessages[projectName]?.includes("successfully");
                  const isDefault = currentPhoto === defaultProjectImages[projectName] || !currentPhoto.startsWith("/uploads");
                  return (
                    <div key={projectName} style={{ display: "flex", gap: "16px", alignItems: "center", paddingBottom: "12px", borderBottom: "1px solid var(--line)" }}>
                      <img 
                        src={currentPhoto} 
                        alt={`${projectName} cover`} 
                        style={{ width: "90px", height: "60px", objectFit: "cover", borderRadius: "4px", border: "1px solid var(--line)" }} 
                      />
                      <div style={{ flex: 1 }}>
                        <h4 style={{ margin: "0 0 4px 0", fontSize: "14px", fontWeight: "600" }}>{projectName}</h4>
                        <span style={{ fontSize: "12px", color: hasMessage ? (isSuccess ? "#2e7d32" : "#d32f2f") : "var(--fg-muted)" }}>
                          {hasMessage ? projectMessages[projectName] : (!isDefault ? "Custom cover uploaded" : "Default portfolio photo is active")}
                        </span>
                      </div>
                      <label className="button button--outline" style={{ margin: 0, cursor: "pointer", fontSize: "13px", padding: "6px 12px" }}>
                        {isUploading ? "Uploading..." : "Change Image"}
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={(e) => handleProjectImageUpload(projectName, e)} 
                          style={{ display: "none" }} 
                          disabled={isUploading}
                        />
                      </label>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      </div>
      <ServiceImageManager services={data.services || []} reload={reload} title="Change service pictures" action="Admin image controls" />
    </>
  );
}

function ServiceImageManager({ services, reload, title = "Service work galleries", action = "Visible on website" }) {
  const [uploading, setUploading] = useState("");
  const [message, setMessage] = useState("");

  async function uploadCover(service, event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(`${service.id}-cover`);
    setMessage("");
    const body = new FormData();
    body.append("image", file);
    try {
      await api.updateServiceImage(service.id, body);
      setMessage(`${service.title} cover photo updated.`);
      event.target.value = "";
      reload();
    } catch (err) {
      setMessage(err.message);
    } finally {
      setUploading("");
    }
  }

  async function uploadWorkPhotos(service, event) {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    setUploading(`${service.id}-gallery`);
    setMessage("");
    const body = new FormData();
    files.slice(0, 12).forEach((file) => body.append("photos", file));
    try {
      await api.addServiceWorkPhotos(service.id, body);
      setMessage(`${files.length} work photo${files.length > 1 ? "s" : ""} added to ${service.title}. Customers can preview them on the Services page.`);
      event.target.value = "";
      reload();
    } catch (err) {
      setMessage(err.message);
    } finally {
      setUploading("");
    }
  }

  return (
    <div className="portal-grid" style={{ gridTemplateColumns: "1fr" }}>
      <section className="panel panel--wide">
        <PanelHead title={title} action={action} />
        <div className="admin-service-grid">
          {services.map((service) => (
            <article className="admin-service-card" key={service.id}>
              <img src={service.image || "/hero-interior.png"} alt={service.title} />
              <div>
                <span>{service.category}</span>
                <h3>{service.title}</h3>
                <div className="admin-work-gallery-strip">
                  {(service.gallery?.length ? service.gallery : [{ url: service.image }]).slice(0, 4).map((photo, index) => <img key={`${photo.url}-${index}`} src={photo.url} alt={`${service.title} work ${index + 1}`} />)}
                  <small>{service.gallery?.length || 0} work photos</small>
                </div>
                <div className="admin-service-actions">
                  <label>
                    <Upload size={15} />
                    {uploading === `${service.id}-cover` ? "Uploading..." : "Replace cover"}
                    <input type="file" accept="image/*" disabled={Boolean(uploading)} onChange={(event) => uploadCover(service, event)} />
                  </label>
                  <label>
                    <Upload size={15} />
                    {uploading === `${service.id}-gallery` ? "Uploading..." : "Add work photos"}
                    <input type="file" accept="image/*" multiple disabled={Boolean(uploading)} onChange={(event) => uploadWorkPhotos(service, event)} />
                  </label>
                </div>
              </div>
            </article>
          ))}
        </div>
        {message && <p className="form-message success">{message}</p>}
      </section>
    </div>
  );
}

function Staff({ data, reload, tab }) {
  const [note, setNote] = useState("");
  const active = data.projects[0];
  async function addNote(event) {
    event.preventDefault();
    if (!note.trim()) return;
    await api.addUpdate({ projectId: active.id, author: "Ananya Rao", note });
    setNote("");
    reload();
  }

  if (tab === "My projects") {
    return (
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
    );
  }

  if (tab === "Tasks") {
    return (
      <div className="portal-grid" style={{ gridTemplateColumns: "1fr" }}>
        <section className="panel">
          <PanelHead title="Today’s tasks list" />
          {data.tasks.map((task) => (
            <label className="task" key={task.id}>
              <input type="checkbox" defaultChecked={task.status === "completed"} />
              <span><strong>{task.title}</strong><small>{task.due} · {task.priority}</small></span>
            </label>
          ))}
        </section>
      </div>
    );
  }

  if (tab === "Work updates") {
    return (
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
    );
  }

  if (tab === "Notes") {
    return (
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
    );
  }

  return (
    <>
      <div className="stat-grid stat-grid--three">
        <article className="stat-card"><div><BriefcaseBusiness /></div><span>Assigned projects</span><strong>{data.projects.length}</strong><small>1 site visit today</small></article>
        <article className="stat-card"><div><ClipboardCheck /></div><span>Open tasks</span><strong>{data.tasks.filter((t) => t.status !== "completed").length}</strong><small>1 high priority</small></article>
        <article className="stat-card"><div><CheckCircle2 /></div><span>Average progress</span><strong>{Math.round(data.projects.reduce((sum, p) => sum + p.progress, 0) / data.projects.length)}%</strong><small>On schedule</small></article>
      </div>
      <div className="portal-grid">
        <section className="panel panel--wide"><PanelHead title="Assigned projects" />{data.projects.map((project) => <div className="staff-project" key={project.id}><img src={project.image} /><div><Status>{project.status}</Status><h3>{project.name}</h3><p>{project.customer} · {project.location}</p><div className="bar"><i style={{ width: `${project.progress}%` }} /></div><small>{project.progress}% complete · Next: {project.nextMilestone}</small></div></div>)}</section>
        <section className="panel"><PanelHead title="Today’s tasks" />{data.tasks.map((task) => <label className="task" key={task.id}><input type="checkbox" defaultChecked={task.status === "completed"} /><span><strong>{task.title}</strong><small>{task.due} · {task.priority}</small></span></label>)}</section>
        <section className="panel panel--wide"><PanelHead title="Daily work update" /><form className="update-form" onSubmit={addNote}><textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="What moved forward on site today?" /><div><button type="button"><Upload size={16} /> Add photos</button><button className="button button--dark">Post update</button></div></form></section>
        <section className="panel"><PanelHead title="Recent notes" />{data.updates.slice(0, 3).map((update) => <div className="note" key={update.id}><span>{update.date.slice(5).replace("-", "/")}</span><p>{update.note}</p></div>)}</section>
      </div>
    </>
  );
}

function Customer({ data, tab }) {
  const project = data.projects[0];
  const payment = data.payments[0];
  async function invoice() {
    const details = await api.invoice(project.id);
    const text = `DESIGN HARMONY\nInvoice ${details.invoice}\nProject: ${details.project}\nCustomer: ${details.customer}\nTotal: ${money(details.total)}\nStatus: ${details.status}`;
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url; link.download = `${details.invoice}.txt`; link.click(); URL.revokeObjectURL(url);
  }

  if (tab === "Project") {
    return (
      <div className="portal-grid" style={{ gridTemplateColumns: "1.5fr 1fr" }}>
        <section className="panel panel--wide">
          <PanelHead title="Project timeline" />
          <div className="timeline">
            {[["Design approved", "Completed", true], ["Civil & electrical", "Completed", true], ["Kitchen installation", "In progress", true], ["Wardrobes & storage", "Up next", false], ["Styling & handover", "July 30", false]].map(([title, label, done], i) => <div className={done ? "done" : ""} key={title}><i>{done ? <CheckCircle2 /> : i + 1}</i><strong>{title}</strong><span>{label}</span></div>)}
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
    );
  }

  if (tab === "Designs & quote") {
    return (
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
    );
  }

  if (tab === "Payments") {
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
  }

  if (tab === "Messages") {
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
  }

  return (
    <>
      <section className="customer-hero">
        <img src={project.image} />
        <div className="customer-overlay" />
        <div><Status>{project.status}</Status><h2>{project.name}</h2><p>{project.category} · {project.location}</p></div>
        <div className="customer-progress"><strong>{project.progress}%</strong><span>Complete</span><i><b style={{ width: `${project.progress}%` }} /></i></div>
      </section>
      <div className="portal-grid customer-grid">
        <section className="panel panel--wide"><PanelHead title="Project timeline" /><div className="timeline">
          {[["Design approved", "Completed", true], ["Civil & electrical", "Completed", true], ["Kitchen installation", "In progress", true], ["Wardrobes & storage", "Up next", false], ["Styling & handover", "July 30", false]].map(([title, label, done], i) => <div className={done ? "done" : ""} key={title}><i>{done ? <CheckCircle2 /> : i + 1}</i><strong>{title}</strong><span>{label}</span></div>)}
        </div></section>
        <section className="panel designer-card"><PanelHead title="Your designer" /><span className="designer-avatar">AR</span><h3>{project.designer}</h3><p>Senior Interior Designer</p><button><MessageSquare size={17} /> Send a message</button></section>
        <section className="panel panel--wide"><PanelHead title="Latest from site" action="All updates" />{data.updates.map((update) => <div className="site-update" key={update.id}><span>{update.date}</span><p>{update.note}</p></div>)}</section>
        <section className="panel payment-card"><PanelHead title="Payment" /><span>Project value</span><h3>{money(project.budget)}</h3><div><Status>{payment?.status || "pending"}</Status><b>{money(payment?.amount || 0)} paid</b></div><button onClick={invoice}><Download size={17} /> Download invoice</button></section>
        <section className="panel panel--wide design-preview"><img src="/bedroom.png" /><div><span className="eyebrow">New design preview</span><h3>Primary bedroom · Option B</h3><p>Ready for your comments and material approval.</p><button className="button button--dark">Open 3D preview</button></div></section>
        <section className="panel feedback"><Star /><h3>How are we doing?</h3><p>Your feedback helps us shape a better experience.</p><button>Share feedback</button></section>
      </div>
    </>
  );
}

function PanelHead({ title, action }) {
  return <header className="panel-head"><h2>{title}</h2>{action && <button>{action} <ChevronRight size={15} /></button>}</header>;
}

function CreateProjectModal({ data, onClose, onCreated }) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const body = Object.fromEntries(formData);
    
    body.progress = Number(body.progress) || 0;
    body.budget = Number(body.budget) || 0;

    try {
      await api.createProject(body);
      onCreated();
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }

  return (
    <div className="modal-overlay" style={{
      position: "fixed",
      inset: 0,
      zIndex: 1100,
      background: "rgba(18, 19, 16, 0.75)",
      backdropFilter: "blur(4px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px"
    }}>
      <div className="modal-content" style={{
        background: "var(--card)",
        color: "var(--ink)",
        width: "550px",
        maxWidth: "100%",
        padding: "35px",
        position: "relative",
        boxShadow: "var(--shadow)",
        border: "1px solid var(--line)",
        maxHeight: "90vh",
        overflowY: "auto"
      }}>
        <button onClick={onClose} style={{
          position: "absolute",
          top: "20px",
          right: "20px",
          border: 0,
          background: "none",
          color: "var(--muted)"
        }} aria-label="Close"><X size={20} /></button>

        <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "32px", margin: "0 0 10px 0" }}>Create New Project</h2>
        <p style={{ color: "var(--muted)", fontSize: "12px", margin: "0 0 25px 0" }}>Fill in the project details below to add it to the studio workspace.</p>

        {error && <div className="form-message error" style={{ marginBottom: "20px" }}>{error}</div>}

        <form onSubmit={handleSubmit} className="design-form" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
          <label style={{ gridColumn: "1 / -1" }}>
            <span>Project Name *</span>
            <input required name="name" placeholder="e.g. Aurelia Residence 3BHK" style={{ width: "100%", border: 0, borderBottom: "1px solid var(--line)", padding: "10px 0", background: "transparent" }} />
          </label>

          <label>
            <span>Customer *</span>
            <select required name="customerId" defaultValue="" style={{ width: "100%", border: 0, borderBottom: "1px solid var(--line)", padding: "10px 0", background: "transparent" }}>
              <option value="" disabled>Select Customer</option>
              {data.customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>

          <label>
            <span>Designer (Staff) *</span>
            <select required name="staffId" defaultValue="" style={{ width: "100%", border: 0, borderBottom: "1px solid var(--line)", padding: "10px 0", background: "transparent" }}>
              <option value="" disabled>Assign Designer</option>
              {data.staff.map(s => <option key={s.id} value={s.id}>{s.name} ({s.title})</option>)}
            </select>
          </label>

          <label>
            <span>Category *</span>
            <select required name="category" defaultValue="Complete Home" style={{ width: "100%", border: 0, borderBottom: "1px solid var(--line)", padding: "10px 0", background: "transparent" }}>
              <option>Complete Home</option>
              <option>Modular Kitchen</option>
              <option>Bedroom</option>
              <option>Office</option>
              <option>Other</option>
            </select>
          </label>

          <label>
            <span>Location *</span>
            <input required name="location" placeholder="e.g. Manikonda, Hyderabad" style={{ width: "100%", border: 0, borderBottom: "1px solid var(--line)", padding: "10px 0", background: "transparent" }} />
          </label>

          <label>
            <span>Budget (INR) *</span>
            <input required type="number" name="budget" placeholder="e.g. 2800000" style={{ width: "100%", border: 0, borderBottom: "1px solid var(--line)", padding: "10px 0", background: "transparent" }} />
          </label>

          <label>
            <span>Status *</span>
            <select required name="status" defaultValue="design" style={{ width: "100%", border: 0, borderBottom: "1px solid var(--line)", padding: "10px 0", background: "transparent" }}>
              <option value="design">Design Phase</option>
              <option value="ongoing">Ongoing Execution</option>
              <option value="completed">Completed</option>
            </select>
          </label>

          <label>
            <span>Payment Status</span>
            <select name="paymentStatus" defaultValue="pending" style={{ width: "100%", border: 0, borderBottom: "1px solid var(--line)", padding: "10px 0", background: "transparent" }}>
              <option value="pending">Pending</option>
              <option value="partial">Partial Payment</option>
              <option value="paid">Fully Paid</option>
            </select>
          </label>

          <label>
            <span>Initial Progress (%)</span>
            <input type="number" min="0" max="100" name="progress" defaultValue="0" style={{ width: "100%", border: 0, borderBottom: "1px solid var(--line)", padding: "10px 0", background: "transparent" }} />
          </label>

          <label>
            <span>Start Date</span>
            <input type="date" name="startDate" defaultValue={new Date().toISOString().slice(0, 10)} style={{ width: "100%", border: 0, borderBottom: "1px solid var(--line)", padding: "10px 0", background: "transparent" }} />
          </label>

          <label>
            <span>Due Date</span>
            <input type="date" name="dueDate" defaultValue={new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)} style={{ width: "100%", border: 0, borderBottom: "1px solid var(--line)", padding: "10px 0", background: "transparent" }} />
          </label>

          <label style={{ gridColumn: "1 / -1" }}>
            <span>Next Milestone</span>
            <input name="nextMilestone" placeholder="e.g. False ceiling layout review" style={{ width: "100%", border: 0, borderBottom: "1px solid var(--line)", padding: "10px 0", background: "transparent" }} />
          </label>

          <label style={{ gridColumn: "1 / -1" }}>
            <span>Card Cover Image</span>
            <select name="image" defaultValue="/hero-interior.png" style={{ width: "100%", border: 0, borderBottom: "1px solid var(--line)", padding: "10px 0", background: "transparent" }}>
              <option value="/hero-interior.png">Living Room Design</option>
              <option value="/kitchen.png">Kitchen Design</option>
              <option value="/bedroom.png">Bedroom Design</option>
              <option value="/wardrobes.png">Wardrobes Design</option>
              <option value="/lighting.png">Lighting Design</option>
              <option value="/office.png">Office Design</option>
            </select>
          </label>

          <div style={{ gridColumn: "1 / -1", display: "flex", gap: "10px", marginTop: "15px", justifyContent: "flex-end" }}>
            <button type="button" onClick={onClose} className="button button--outline" style={{ padding: "12px 20px" }}>Cancel</button>
            <button type="submit" className="button button--dark" disabled={loading} style={{ padding: "12px 20px" }}>
              {loading ? "Creating..." : "Create Project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
