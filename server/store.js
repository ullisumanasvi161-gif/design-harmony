import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { hashPassword } from "./auth.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.join(__dirname, "..", "db.json");

const now = new Date().toISOString();
const initialData = {
  users: [
    {
      id: "u-admin",
      name: "K. Krishna Chaitanya",
      email: "admin@designharmony.com",
      phone: "7013162157",
      role: "admin",
      passwordHash: hashPassword("admin123"),
      avatar: "KC"
    },
    {
      id: "u-staff",
      name: "Ananya Rao",
      email: "staff@designharmony.com",
      phone: "8977527728",
      role: "staff",
      title: "Senior Interior Designer",
      passwordHash: hashPassword("staff123"),
      avatar: "AR"
    },
    {
      id: "u-customer",
      name: "Rohan Mehta",
      email: "customer@designharmony.com",
      phone: "9848012345",
      role: "customer",
      passwordHash: hashPassword("customer123"),
      avatar: "RM"
    }
  ],
  services: [
    { id: "s1", title: "Complete Home Interiors", category: "Residential", status: "active", image: "/services/complete-home.webp" },
    { id: "s2", title: "Modular Kitchen Design", category: "Residential", status: "active", image: "/services/modular-kitchen.webp" },
    { id: "s3", title: "Living Room Interiors", category: "Residential", status: "active", image: "/services/living-room.webp" },
    { id: "s4", title: "Bedroom Interiors", category: "Residential", status: "active", image: "/services/bedroom.webp" },
    { id: "s5", title: "Wardrobes & Storage", category: "Residential", status: "active", image: "/services/wardrobe-storage.webp" },
    { id: "s6", title: "False Ceiling & Lighting", category: "Specialist", status: "active", image: "/services/ceilings-lighting.webp" },
    { id: "s7", title: "Office Interiors", category: "Commercial", status: "active", image: "/services/office-interiors.webp" },
    { id: "s8", title: "3D Interior Visualization", category: "Design", status: "active", image: "/services/visualization-3d.webp" },
    { id: "s9", title: "Turnkey Interior Projects", category: "Execution", status: "active", image: "/services/turnkey-projects.webp" }
  ],
  bookings: [
    {
      id: "b1",
      name: "Sneha Reddy",
      mobile: "9988776655",
      email: "sneha@example.com",
      location: "Kokapet",
      projectType: "Complete Home Interiors",
      budget: "₹25–35L",
      preferredDate: "2026-06-24",
      status: "new",
      createdAt: now
    },
    {
      id: "b2",
      name: "Vikram Shah",
      mobile: "9876543210",
      email: "vikram@example.com",
      location: "Jubilee Hills",
      projectType: "Office Interiors",
      budget: "₹35–50L",
      preferredDate: "2026-06-28",
      status: "confirmed",
      createdAt: now
    }
  ],
  projects: [
    {
      id: "p1",
      name: "Aurelia Residence",
      customerId: "u-customer",
      customer: "Rohan Mehta",
      location: "Manikonda",
      category: "3BHK Residence",
      budget: 2800000,
      status: "ongoing",
      paymentStatus: "partial",
      progress: 68,
      staffId: "u-staff",
      designer: "Ananya Rao",
      startDate: "2026-04-10",
      dueDate: "2026-07-30",
      nextMilestone: "Wardrobe installation",
      image: "/bedroom.png"
    },
    {
      id: "p2",
      name: "Serein Kitchen",
      customer: "Sneha Reddy",
      location: "Kokapet",
      category: "Modular Kitchen",
      budget: 950000,
      status: "design",
      paymentStatus: "pending",
      progress: 32,
      staffId: "u-staff",
      designer: "Ananya Rao",
      startDate: "2026-06-02",
      dueDate: "2026-08-12",
      nextMilestone: "Material sign-off",
      image: "/kitchen.png"
    },
    {
      id: "p3",
      name: "Atelier One",
      customer: "Vikram Shah",
      location: "Jubilee Hills",
      category: "Office Interior",
      budget: 4200000,
      status: "completed",
      paymentStatus: "paid",
      progress: 100,
      staffId: "u-staff",
      designer: "Ananya Rao",
      startDate: "2026-01-20",
      dueDate: "2026-05-18",
      nextMilestone: "Project closed",
      image: "/office.png"
    }
  ],
  tasks: [
    { id: "t1", projectId: "p1", title: "Confirm veneer polish sample", status: "ongoing", priority: "high", due: "Today" },
    { id: "t2", projectId: "p1", title: "Upload wardrobe site measurements", status: "pending", priority: "medium", due: "Tomorrow" },
    { id: "t3", projectId: "p2", title: "Revise island lighting layout", status: "pending", priority: "medium", due: "Jun 23" }
  ],
  payments: [
    { id: "pay1", projectId: "p1", customer: "Rohan Mehta", amount: 1400000, status: "partial", date: "2026-06-11" },
    { id: "pay2", projectId: "p3", customer: "Vikram Shah", amount: 4200000, status: "paid", date: "2026-05-16" }
  ],
  testimonials: [
    {
      id: "tm1",
      name: "Madhavi & Arjun",
      location: "Manikonda",
      rating: 5,
      text: "They translated how we wanted our home to feel, not just how it should look. The execution was beautifully managed."
    },
    {
      id: "tm2",
      name: "Sanjay Varma",
      location: "Financial District",
      rating: 5,
      text: "Clear budgets, thoughtful design, and excellent site discipline. Our office feels quietly distinctive."
    }
  ],
  contacts: [],
  notifications: [
    { id: "n1", userId: "u-customer", title: "Design update", message: "Your bedroom 3D view is ready for review.", read: false, createdAt: now },
    { id: "n2", userId: "u-staff", title: "Site reminder", message: "Aurelia Residence review at 3:00 PM.", read: false, createdAt: now }
  ],
  updates: [
    { id: "up1", projectId: "p1", author: "Ananya Rao", note: "False ceiling framework completed in living and dining.", date: "2026-06-18" },
    { id: "up2", projectId: "p1", author: "Ananya Rao", note: "Kitchen carcass installation passed quality check.", date: "2026-06-16" }
  ]
};

function ensureStore() {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(initialData, null, 2));
  }
}

export function readStore() {
  ensureStore();
  return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
}

export function writeStore(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  return data;
}

export function id(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}
