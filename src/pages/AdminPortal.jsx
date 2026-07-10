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

const adminNav = [
  [LayoutDashboard, "Overview"],
  [CalendarDays, "Bookings"],
  [BriefcaseBusiness, "Projects"],
  [Upload, "Services"],
  [Users, "People"],
  [WalletCards, "Payments"],
  [MessageSquare, "Messages"],
  [Settings, "Settings"]
];

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

export default function AdminPortal() {
  const { user, logout } = useAuth();
  const [data, setData] = useState(null);
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState("Overview");
  const [error, setError] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [userRole, setUserRole] = useState("customer");
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const load = () => api.dashboard().then(setData).catch((err) => setError(err.message));

  useEffect(() => {
    load();
  }, []);

  if (!user || user.role !== "admin") {
    return <Navigate to="/admin/login" replace />;
  }

  if (!data) {
    return (
      <div className="portal-loading">
        <Logo />
        <span>{error || "Preparing your admin workspace…"}</span>
      </div>
    );
  }

  function handleLogout() {
    logout();
    window.location.href = "/admin/login";
  }

  const pendingCustomers = data.stats.pendingBookings ?? data.bookings.filter((b) => ["new", "pending"].includes(String(b.status).toLowerCase())).length;
  const completedCustomers = data.stats.completed ?? data.projects.filter((p) => p.status === "completed").length;
  const pendingPaymentTotal = data.stats.pendingRevenue ?? data.payments.filter((p) => p.status === "pending").reduce((sum, p) => sum + p.amount, 0);
  const cards = [
    [CircleDollarSign, money(data.stats.revenue), "Revenue earned", `${money(pendingPaymentTotal)} pending`],
    [Users, pendingCustomers, "Pending customers", "Need admin contact"],
    [CheckCircle2, completedCustomers, "Completed customers", "Finished projects"],
    [WalletCards, data.payments.length, "Payment details", `${data.payments.filter((p) => p.status === "paid").length} paid records`]
  ];

  async function bookingStatus(id, status) {
    await api.updateBooking(id, { status });
    load();
  }

  return (
    <div className="portal portal--admin">
      <aside className={open ? "portal-side open" : "portal-side"}>
        <div className="side-head">
          <Logo compact />
          <button onClick={() => setOpen(false)}><X /></button>
        </div>
        <div className="role-chip role-chip--admin">admin portal</div>
        <nav>
          {adminNav.map(([Icon, label], index) => (
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
          <button onClick={() => { setTab("Settings"); setOpen(false); }}><Settings size={19} /> Settings</button>
          <Link to="/"><Home size={19} /> Website</Link>
          <button onClick={handleLogout}><LogOut size={19} /> Sign out</button>
        </div>
      </aside>

      <div className="portal-main">
        <header className="portal-topbar">
          <button className="portal-menu" onClick={() => setOpen(true)}><Menu /></button>
          <div className="portal-search"><Search size={17} /><input placeholder="Search projects, customers…" /></div>
          <div className="portal-user">
            <button className="notification"><Bell size={19} /><i /></button>
            <span>{user.avatar}</span>
            <div><strong>{user.name}</strong><small>{user.title || "Administrator"}</small></div>
          </div>
        </header>

        <main className="portal-content">
          <div className="portal-heading">
            <div>
              <span>{new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}</span>
              <h1>Studio overview</h1>
              <p>Here's what's moving across Design Harmony today.</p>
            </div>
            <button className="button button--dark" onClick={() => setShowCreateModal(true)}>+ New project</button>
          </div>

          {/* Tab content */}
          {tab === "Bookings" && (
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
          )}

          {tab === "Projects" && (
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
          )}

          {tab === "Services" && <ServiceImageManager services={data.services || []} reload={load} />}

          {tab === "Settings" && <AdminSettings data={data} reload={load} />}

          {tab === "People" && (
            <div className="portal-grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
              <section className="panel">
                <PanelHead title="Staff members" action="+ New Staff" onAction={() => { setUserRole("staff"); setShowUserModal(true); }} />
                {data.staff.map((person) => (
                  <div className="person-row" key={person.id}>
                    <span>{person.avatar}</span>
                    <div><strong>{person.name}</strong><small>{person.title}</small></div>
                    <i className="online" />
                  </div>
                ))}
              </section>
              <section className="panel">
                <PanelHead title="Customers" action="+ New Customer" onAction={() => { setUserRole("customer"); setShowUserModal(true); }} />
                {data.customers.map((person) => (
                  <div className="person-row" key={person.id}>
                    <span>{person.avatar}</span>
                    <div><strong>{person.name}</strong><small>Customer</small></div>
                    <i className="online" />
                  </div>
                ))}
              </section>
            </div>
          )}

          {tab === "Payments" && (
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
                <PanelHead title="Recorded payments log" action="+ Record Payment" onAction={() => setShowPaymentModal(true)} />
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
          )}

          {tab === "Messages" && (
            <div className="portal-grid" style={{ gridTemplateColumns: "1fr" }}>
              <section className="panel" style={{ height: "400px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <PanelHead title="Inbox Messages" />
                <div style={{ textAlign: "center", color: "var(--muted)", margin: "auto" }}>
                  <MessageSquare size={48} style={{ color: "var(--gold)", marginBottom: "15px" }} />
                  <p>No new messages. Select a project or staff member to start a conversation.</p>
                </div>
              </section>
            </div>
          )}

          {/* Default Overview tab */}
          {(tab === "Overview") && (
            <>
              <div className="stat-grid">
                {cards.map(([Icon, value, label, note]) => (
                  <article className="stat-card" key={label}>
                    <div><Icon size={20} /></div>
                    <span>{label}</span>
                    <strong>{value}</strong>
                    <small>{note}</small>
                  </article>
                ))}
              </div>
              <div className="portal-grid">
                <section className="panel panel--wide">
                  <PanelHead title="Live projects" action="View all" />
                  <div className="project-table">
                    {data.projects.map((project) => (
                      <div className="project-row" key={project.id}>
                        <img src={project.image} />
                        <div className="project-name"><strong>{project.name}</strong><span>{project.customer} · {project.location}</span></div>
                        <div className="progress-cell"><span>{project.progress}%</span><i><b style={{ width: `${project.progress}%` }} /></i></div>
                        <Status>{project.status}</Status>
                        <ChevronRight />
                      </div>
                    ))}
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
                <section className="panel">
                  <PanelHead title="Team" action={`${data.staff.length} members`} />
                  {data.staff.map((person) => (
                    <div className="person-row" key={person.id}>
                      <span>{person.avatar}</span>
                      <div><strong>{person.name}</strong><small>{person.title}</small></div>
                      <i className="online" />
                    </div>
                  ))}
                </section>
              </div>
            </>
          )}
        </main>
      </div>

      {showCreateModal && (
        <CreateProjectModal
          data={data}
          onClose={() => setShowCreateModal(false)}
          onCreated={() => { setShowCreateModal(false); load(); }}
        />
      )}
      {showUserModal && (
        <CreateUserModal
          role={userRole}
          onClose={() => setShowUserModal(false)}
          onCreated={() => { setShowUserModal(false); load(); }}
        />
      )}
      {showPaymentModal && (
        <RecordPaymentModal
          customers={data.customers}
          projects={data.projects}
          onClose={() => setShowPaymentModal(false)}
          onCreated={() => { setShowPaymentModal(false); load(); }}
        />
      )}
    </div>
  );
}

function PanelHead({ title, action, onAction }) {
  return (
    <header className="panel-head">
      <h2>{title}</h2>
      {action && <button type="button" onClick={onAction}>{action} <ChevronRight size={15} /></button>}
    </header>
  );
}

function PaymentDetailsPanel({ payments }) {
  const paidTotal = payments
    .filter((p) => ["paid", "partial"].includes(String(p.status).toLowerCase()))
    .reduce((sum, p) => sum + p.amount, 0);
  const pendingTotal = payments
    .filter((p) => String(p.status).toLowerCase() === "pending")
    .reduce((sum, p) => sum + p.amount, 0);

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
            <div><strong>{payment.customer}</strong><small>{payment.date}</small></div>
            <div><strong>{money(payment.amount)}</strong><Status>{payment.status}</Status></div>
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
                      <img src={currentPhoto} alt={`${projectName} cover`} style={{ width: "90px", height: "60px", objectFit: "cover", borderRadius: "4px", border: "1px solid var(--line)" }} />
                      <div style={{ flex: 1 }}>
                        <h4 style={{ margin: "0 0 4px 0", fontSize: "14px", fontWeight: "600" }}>{projectName}</h4>
                        <span style={{ fontSize: "12px", color: hasMessage ? (isSuccess ? "#2e7d32" : "#d32f2f") : "var(--fg-muted)" }}>
                          {hasMessage ? projectMessages[projectName] : (!isDefault ? "Custom cover uploaded" : "Default portfolio photo is active")}
                        </span>
                      </div>
                      <label className="button button--outline" style={{ margin: 0, cursor: "pointer", fontSize: "13px", padding: "6px 12px" }}>
                        {isUploading ? "Uploading..." : "Change Image"}
                        <input type="file" accept="image/*" onChange={(e) => handleProjectImageUpload(projectName, e)} style={{ display: "none" }} disabled={isUploading} />
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
      setMessage(`${files.length} work photo${files.length > 1 ? "s" : ""} added to ${service.title}.`);
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
                  {(service.gallery?.length ? service.gallery : [{ url: service.image }]).slice(0, 4).map((photo, index) => (
                    <img key={`${photo.url}-${index}`} src={photo.url} alt={`${service.title} work ${index + 1}`} />
                  ))}
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
    <div className="modal-overlay" style={{ position: "fixed", inset: 0, zIndex: 1100, background: "rgba(18,19,16,0.75)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
      <div className="modal-content" style={{ background: "var(--card)", color: "var(--ink)", width: "550px", maxWidth: "100%", padding: "35px", position: "relative", boxShadow: "var(--shadow)", border: "1px solid var(--line)", maxHeight: "90vh", overflowY: "auto" }}>
        <button onClick={onClose} style={{ position: "absolute", top: "20px", right: "20px", border: 0, background: "none", color: "var(--muted)" }} aria-label="Close"><X size={20} /></button>
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
              {data.customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
          <label>
            <span>Designer (Staff) *</span>
            <select required name="staffId" defaultValue="" style={{ width: "100%", border: 0, borderBottom: "1px solid var(--line)", padding: "10px 0", background: "transparent" }}>
              <option value="" disabled>Assign Designer</option>
              {data.staff.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.title})</option>)}
            </select>
          </label>
          <label>
            <span>Category *</span>
            <select required name="category" defaultValue="Complete Home" style={{ width: "100%", border: 0, borderBottom: "1px solid var(--line)", padding: "10px 0", background: "transparent" }}>
              <option>Complete Home</option><option>Modular Kitchen</option><option>Bedroom</option><option>Office</option><option>Other</option>
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
              <option value="design">Design Phase</option><option value="ongoing">Ongoing Execution</option><option value="completed">Completed</option>
            </select>
          </label>
          <label>
            <span>Payment Status</span>
            <select name="paymentStatus" defaultValue="pending" style={{ width: "100%", border: 0, borderBottom: "1px solid var(--line)", padding: "10px 0", background: "transparent" }}>
              <option value="pending">Pending</option><option value="partial">Partial Payment</option><option value="paid">Fully Paid</option>
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

function CreateUserModal({ role, onClose, onCreated }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const form = e.target;
    const body = {
      name: form.name.value,
      email: form.email.value,
      phone: form.phone.value,
      role
    };
    if (role === 'staff' && form.password) {
      body.password = form.password.value;
    }
    try {
      await api.createUser(body);
      onCreated();
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal">
        <header>
          <h3>Add new {role}</h3>
          <button onClick={onClose}><X size={20} /></button>
        </header>
        <form onSubmit={handleSubmit}>
          {error && <div className="error-msg">{error}</div>}
          <div className="field">
            <label>Full Name</label>
            <input name="name" required placeholder="e.g. Jane Doe" />
          </div>
          <div className="field">
            <label>Email address</label>
            <input name="email" type="email" required placeholder="jane@example.com" />
          </div>
          <div className="field">
            <label>Phone number</label>
            <input name="phone" required placeholder="+91 9876543210" />
          </div>
          {role === 'staff' && (
            <div className="field">
              <label>Password (for staff login)</label>
              <input name="password" required minLength="6" placeholder="Choose a password" />
            </div>
          )}
          <footer style={{ marginTop: 24, display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <button type="button" className="button" onClick={onClose} disabled={loading}>Cancel</button>
            <button type="submit" className="button button--dark" disabled={loading}>
              {loading ? 'Adding...' : `Add ${role}`}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}

function RecordPaymentModal({ customers, projects, onClose, onCreated }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const form = e.target;
    const body = {
      customerId: form.customerId.value,
      projectId: form.projectId.value,
      amount: form.amount.value,
      milestone: form.milestone.value,
      date: new Date().toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }),
      status: 'paid'
    };
    try {
      await api.createPayment(body);
      onCreated();
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal">
        <header>
          <h3>Record Payment</h3>
          <button onClick={onClose}><X size={20} /></button>
        </header>
        <form onSubmit={handleSubmit}>
          {error && <div className="error-msg">{error}</div>}
          <div className="field">
            <label>Customer</label>
            <select name="customerId" required>
              <option value="">Select a customer</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Project (Optional)</label>
            <select name="projectId">
              <option value="">General / No project</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Amount (₹)</label>
            <input name="amount" type="number" required placeholder="e.g. 50000" />
          </div>
          <div className="field">
            <label>Milestone / Note</label>
            <input name="milestone" required placeholder="e.g. Advance Payment" />
          </div>
          <footer style={{ marginTop: 24, display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <button type="button" className="button" onClick={onClose} disabled={loading}>Cancel</button>
            <button type="submit" className="button button--dark" disabled={loading}>
              {loading ? 'Recording...' : 'Record Payment'}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}
