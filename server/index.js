import express from "express";
import cors from "cors";
import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { hashPassword, requireAuth, signToken, verifyPassword } from "./auth.js";
import { id, readStore, writeStore } from "./store.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 4000;
// On Vercel serverless, only /tmp is writable
const uploadDir = process.env.VERCEL === "1"
  ? "/tmp/uploads"
  : path.join(__dirname, "..", "uploads");
fs.mkdirSync(uploadDir, { recursive: true });

app.use(cors());
app.use(express.json({ limit: "2mb" }));
app.use("/uploads", express.static(uploadDir));

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || ".png";
    const uniqueName = crypto.randomBytes(16).toString("hex");
    cb(null, `${uniqueName}${ext}`);
  }
});
const upload = multer({ storage, limits: { fileSize: 8 * 1024 * 1024 } });

const getSettings = (db) => {
  const defaults = {
    previewPhoto: "/bedroom.png",
    previewPhotos: {
      "Living Room": "/bedroom.png",
      "Kitchen": "/kitchen.png",
      "Bedroom": "/bedroom.png",
      "Office": "/office.png"
    },
    projectImages: {
      "Aurelia Residence": "/hero-interior.png",
      "Serein Kitchen": "/kitchen.png",
      "Nocturne Suite": "/bedroom.png",
      "Atelier One": "/office.png"
    }
  };
  if (!db.settings) return defaults;
  return {
    ...defaults,
    ...db.settings,
    previewPhotos: {
      ...defaults.previewPhotos,
      ...(db.settings.previewPhotos || {})
    },
    projectImages: {
      ...defaults.projectImages,
      ...(db.settings.projectImages || {})
    }
  };
};

const publicUser = ({ passwordHash, ...user }) => user;

app.get("/api/health", (_req, res) => res.json({ ok: true, service: "Design Harmony API" }));

app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  const db = readStore();
  const user = db.users.find((item) => item.email.toLowerCase() === String(email).toLowerCase());
  if (!user || !verifyPassword(password || "", user.passwordHash)) {
    return res.status(401).json({ message: "Email or password is incorrect." });
  }
  const safe = publicUser(user);
  res.json({ token: signToken({ id: user.id, role: user.role, email: user.email }), user: safe });
});

app.post("/api/auth/register", (req, res) => {
  const db = readStore();
  if (db.users.some((user) => user.email.toLowerCase() === req.body.email?.toLowerCase())) {
    return res.status(409).json({ message: "An account already exists with this email." });
  }
  const user = {
    id: id("u"),
    name: req.body.name,
    email: req.body.email,
    phone: req.body.phone,
    role: "customer",
    avatar: req.body.name?.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase(),
    passwordHash: hashPassword(req.body.password)
  };
  db.users.push(user);
  writeStore(db);
  const safe = publicUser(user);
  res.status(201).json({ token: signToken({ id: user.id, role: user.role, email: user.email }), user: safe });
});

app.get("/api/auth/me", requireAuth(), (req, res) => {
  const user = readStore().users.find((item) => item.id === req.user.id);
  res.json(publicUser(user));
});

app.get("/api/public", (_req, res) => {
  const db = readStore();
  res.json({
    services: db.services,
    projects: db.projects,
    testimonials: db.testimonials,
    settings: getSettings(db)
  });
});

app.post("/api/bookings", (req, res) => {
  const db = readStore();
  const booking = {
    id: id("b"),
    ...req.body,
    status: "new",
    createdAt: new Date().toISOString()
  };
  db.bookings.unshift(booking);
  writeStore(db);
  res.status(201).json(booking);
});

app.post("/api/contacts", (req, res) => {
  const db = readStore();
  const contact = { id: id("c"), ...req.body, status: "unread", createdAt: new Date().toISOString() };
  db.contacts.unshift(contact);
  writeStore(db);
  res.status(201).json(contact);
});

app.get("/api/dashboard", requireAuth(), (req, res) => {
  const db = readStore();
  const visibleProjects =
    req.user.role === "admin"
      ? db.projects
      : req.user.role === "staff"
        ? db.projects.filter((project) => project.staffId === req.user.id)
        : db.projects.filter((project) => project.customerId === req.user.id);
  const projectIds = visibleProjects.map((project) => project.id);
  const pendingBookings = db.bookings.filter((booking) => ["new", "pending"].includes(String(booking.status).toLowerCase())).length;
  const contactedBookings = db.bookings.filter((booking) => ["contacted", "confirmed"].includes(String(booking.status).toLowerCase())).length;
  const completedProjects = db.projects.filter((project) => project.status === "completed").length;
  const earnedRevenue = db.payments
    .filter((payment) => ["paid", "partial"].includes(String(payment.status).toLowerCase()))
    .reduce((sum, payment) => sum + payment.amount, 0);
  const pendingRevenue = db.payments
    .filter((payment) => ["pending"].includes(String(payment.status).toLowerCase()))
    .reduce((sum, payment) => sum + payment.amount, 0);
  res.json({
    services: db.services,
    projects: visibleProjects,
    tasks: db.tasks.filter((task) => projectIds.includes(task.projectId)),
    bookings: req.user.role === "admin" ? db.bookings : [],
    payments:
      req.user.role === "admin"
        ? db.payments
        : db.payments.filter((payment) => projectIds.includes(payment.projectId)),
    notifications: db.notifications.filter((note) => note.userId === req.user.id),
    updates: db.updates.filter((update) => projectIds.includes(update.projectId)),
    staff: req.user.role === "admin" ? db.users.filter((user) => user.role === "staff").map(publicUser) : [],
    customers: req.user.role === "admin" ? db.users.filter((user) => user.role === "customer").map(publicUser) : [],
    settings: getSettings(db),
    stats: {
      customers: db.users.filter((user) => user.role === "customer").length,
      bookings: db.bookings.length,
      pendingBookings,
      contactedBookings,
      ongoing: db.projects.filter((project) => project.status === "ongoing").length,
      completed: completedProjects,
      staff: db.users.filter((user) => user.role === "staff").length,
      revenue: earnedRevenue,
      pendingRevenue
    }
  });
});

app.patch("/api/projects/:id", requireAuth(["admin", "staff"]), (req, res) => {
  const db = readStore();
  const index = db.projects.findIndex((project) => project.id === req.params.id);
  if (index < 0) return res.status(404).json({ message: "Project not found." });
  db.projects[index] = { ...db.projects[index], ...req.body };
  writeStore(db);
  res.json(db.projects[index]);
});

app.post("/api/projects", requireAuth(["admin"]), (req, res) => {
  const db = readStore();
  const customerUser = db.users.find((u) => u.id === req.body.customerId);
  const staffUser = db.users.find((u) => u.id === req.body.staffId);

  const project = {
    id: id("p"),
    name: req.body.name,
    customerId: req.body.customerId,
    customer: customerUser ? customerUser.name : (req.body.customer || "Unknown Client"),
    location: req.body.location || "Hyderabad",
    category: req.body.category || "General Interiors",
    budget: Number(req.body.budget) || 0,
    status: req.body.status || "design",
    paymentStatus: req.body.paymentStatus || "pending",
    progress: Number(req.body.progress) || 0,
    staffId: req.body.staffId,
    designer: staffUser ? staffUser.name : (req.body.designer || "Unassigned"),
    startDate: req.body.startDate || new Date().toISOString().slice(0, 10),
    dueDate: req.body.dueDate || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    nextMilestone: req.body.nextMilestone || "Initial design consultation",
    image: req.body.image || "/hero-interior.png"
  };

  db.projects.unshift(project);
  writeStore(db);
  res.status(201).json(project);
});

app.patch("/api/services/:id/image", requireAuth(["admin"]), upload.single("image"), (req, res) => {
  if (!req.file) return res.status(400).json({ message: "Please choose an image to upload." });
  const db = readStore();
  const index = db.services.findIndex((service) => service.id === req.params.id);
  if (index < 0) return res.status(404).json({ message: "Service not found." });
  db.services[index] = {
    ...db.services[index],
    image: `/uploads/${req.file.filename}`,
    imageName: req.file.originalname,
    updatedAt: new Date().toISOString()
  };
  writeStore(db);
  res.json(db.services[index]);
});

app.post("/api/services", requireAuth(["admin"]), upload.single("image"), (req, res) => {
  const db = readStore();
  if (!req.body.title?.trim()) return res.status(400).json({ message: "Service title is required." });
  const service = {
    id: id("s"),
    title: req.body.title.trim(),
    category: req.body.category || "Custom",
    copy: req.body.copy || "A tailored interior service managed by the Design Harmony studio.",
    status: "active",
    image: req.file ? `/uploads/${req.file.filename}` : "/hero-interior.png",
    gallery: req.file ? [{ url: `/uploads/${req.file.filename}`, name: req.file.originalname, uploadedAt: new Date().toISOString() }] : [],
    createdAt: new Date().toISOString()
  };
  db.services.push(service);
  writeStore(db);
  res.status(201).json(service);
});

app.post("/api/services/:id/gallery", requireAuth(["admin"]), upload.array("photos", 12), (req, res) => {
  if (!req.files?.length) return res.status(400).json({ message: "Please choose one or more work photos." });
  const db = readStore();
  const index = db.services.findIndex((service) => service.id === req.params.id);
  if (index < 0) return res.status(404).json({ message: "Service not found." });
  const newPhotos = req.files.map((file) => ({
    url: `/uploads/${file.filename}`,
    name: file.originalname,
    uploadedAt: new Date().toISOString()
  }));
  const gallery = [...(db.services[index].gallery || []), ...newPhotos].slice(-18);
  db.services[index] = {
    ...db.services[index],
    gallery,
    image: db.services[index].image || gallery[0]?.url,
    updatedAt: new Date().toISOString()
  };
  writeStore(db);
  res.status(201).json(db.services[index]);
});

app.patch("/api/bookings/:id", requireAuth(["admin"]), (req, res) => {
  const db = readStore();
  const index = db.bookings.findIndex((booking) => booking.id === req.params.id);
  if (index < 0) return res.status(404).json({ message: "Booking not found." });
  db.bookings[index] = { ...db.bookings[index], ...req.body };
  writeStore(db);
  res.json(db.bookings[index]);
});

app.post("/api/updates", requireAuth(["admin", "staff"]), (req, res) => {
  const db = readStore();
  const update = { id: id("up"), ...req.body, date: new Date().toISOString().slice(0, 10) };
  db.updates.unshift(update);
  writeStore(db);
  res.status(201).json(update);
});

app.post("/api/upload", requireAuth(), upload.single("file"), (req, res) => {
  res.status(201).json({ url: `/uploads/${req.file.filename}`, name: req.file.originalname });
});

app.post("/api/settings/3d-photo/:room", requireAuth(["admin"]), upload.single("previewPhoto"), (req, res) => {
  if (!req.file) return res.status(400).json({ message: "Please choose an image to upload." });
  const { room } = req.params;
  const db = readStore();
  
  if (!db.settings) db.settings = {};
  if (!db.settings.previewPhotos) {
    db.settings.previewPhotos = {
      "Living Room": db.settings.previewPhoto || "/bedroom.png",
      "Kitchen": "/kitchen.png",
      "Bedroom": "/bedroom.png",
      "Office": "/office.png"
    };
  }
  
  const filePath = `/uploads/${req.file.filename}`;
  db.settings.previewPhotos[room] = filePath;
  
  // Maintain old single field for absolute backwards compatibility
  if (room === "Living Room" || room === "Bedroom") {
    db.settings.previewPhoto = filePath;
  }
  
  db.settings.updatedAt = new Date().toISOString();
});

app.post("/api/settings/project-image/:projectName", requireAuth(["admin"]), upload.single("projectImage"), (req, res) => {
  if (!req.file) return res.status(400).json({ message: "Please choose an image to upload." });
  const { projectName } = req.params;
  const db = readStore();
  
  if (!db.settings) db.settings = {};
  if (!db.settings.projectImages) {
    db.settings.projectImages = {
      "Aurelia Residence": "/hero-interior.png",
      "Serein Kitchen": "/kitchen.png",
      "Nocturne Suite": "/bedroom.png",
      "Atelier One": "/office.png"
    };
  }
  
  const filePath = `/uploads/${req.file.filename}`;
  db.settings.projectImages[projectName] = filePath;
  db.settings.updatedAt = new Date().toISOString();
  writeStore(db);
  res.json(getSettings(db));
});

app.get("/api/invoice/:projectId", requireAuth(), (req, res) => {
  const db = readStore();
  const project = db.projects.find((item) => item.id === req.params.projectId);
  if (!project) return res.status(404).json({ message: "Project not found." });
  res.json({
    invoice: `DH-${project.id.toUpperCase()}-2026`,
    project: project.name,
    customer: project.customer,
    total: project.budget,
    status: project.paymentStatus,
    issuedBy: "Design Harmony"
  });
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: "Something went wrong. Please try again." });
});

// Only listen when running locally (not on Vercel serverless)
if (process.env.VERCEL !== "1") {
  app.listen(PORT, () => {
    console.log(`Design Harmony API running at http://localhost:${PORT}`);
  });
}

export default app;
