import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { api } from "./api";
import PublicLayout, {
  About,
  Consultation,
  Contact,
  Home,
  Portfolio,
  DesignPlanner,
  Services
} from "./pages/Public";
import CustomerAuth from "./pages/CustomerAuth";
import CustomerAccount from "./pages/CustomerAccount";
import AdminAuth from "./pages/AdminAuth";
import AdminPortal from "./pages/AdminPortal";
import StaffAuth from "./pages/StaffAuth";
import StaffPortal from "./pages/StaffPortal";

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

/** Requires user to be logged in with role = "customer" */
function CustomerProtected({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === "admin") return <Navigate to="/admin" replace />;
  if (user.role === "staff") return <Navigate to="/staff" replace />;
  return children;
}

/** Requires user to be logged in with role = "admin" */
function AdminProtected({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/admin/login" replace />;
  if (user.role !== "admin") return <Navigate to="/admin/login" replace />;
  return children;
}

/** Requires user to be logged in with role = "staff" (or admin) */
function StaffProtected({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/staff/login" replace />;
  if (user.role !== "staff" && user.role !== "admin") return <Navigate to="/staff/login" replace />;
  return children;
}

function RouteReset() {
  const location = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [location.pathname]);
  return null;
}

export default function App() {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("dh-user"));
    } catch {
      return null;
    }
  });

  useEffect(() => {
    document.documentElement.dataset.theme = "light";
    localStorage.setItem("dh-theme", "light");
  }, []);

  const auth = useMemo(
    () => ({
      user,
      theme: "light",
      toggleTheme: () => {},
      async login(credentials) {
        const result = await api.login(credentials);
        localStorage.setItem("dh-token", result.token);
        localStorage.setItem("dh-user", JSON.stringify(result.user));
        setUser(result.user);
        return result.user;
      },
      async register(details) {
        const result = await api.register(details);
        localStorage.setItem("dh-token", result.token);
        localStorage.setItem("dh-user", JSON.stringify(result.user));
        setUser(result.user);
        return result.user;
      },
      logout() {
        localStorage.removeItem("dh-token");
        localStorage.removeItem("dh-user");
        setUser(null);
      }
    }),
    [user]
  );

  useEffect(() => {
    const handleUnauthorized = () => {
      auth.logout();
    };
    window.addEventListener("dh-unauthorized", handleUnauthorized);
    return () => window.removeEventListener("dh-unauthorized", handleUnauthorized);
  }, [auth]);

  return (
    <AuthContext.Provider value={auth}>
      <RouteReset />
      <AnimatePresence mode="wait">
        <Routes>
          {/* ── Public website routes ── */}
          <Route element={<PublicLayout />}>
            <Route index element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/services" element={<Services />} />
            <Route path="/projects" element={<Portfolio />} />
            <Route path="/design-planner" element={<DesignPlanner />} />
            <Route path="/consultation" element={<Consultation />} />
            <Route path="/contact" element={<Contact />} />
          </Route>

          {/* ── Customer auth ── */}
          <Route path="/signup" element={<CustomerAuth />} />
          <Route path="/login" element={<CustomerAuth />} />

          {/* ── Customer protected area ── */}
          <Route
            path="/account"
            element={
              <CustomerProtected>
                <CustomerAccount />
              </CustomerProtected>
            }
          />
          <Route
            path="/account/*"
            element={
              <CustomerProtected>
                <CustomerAccount />
              </CustomerProtected>
            }
          />

          {/* ── Admin portal ── */}
          <Route path="/admin/login" element={<AdminAuth />} />
          <Route
            path="/admin"
            element={
              <AdminProtected>
                <AdminPortal />
              </AdminProtected>
            }
          />
          <Route
            path="/admin/*"
            element={
              <AdminProtected>
                <AdminPortal />
              </AdminProtected>
            }
          />

          {/* ── Staff portal ── */}
          <Route path="/staff/login" element={<StaffAuth />} />
          <Route
            path="/staff"
            element={
              <StaffProtected>
                <StaffPortal />
              </StaffProtected>
            }
          />
          <Route
            path="/staff/*"
            element={
              <StaffProtected>
                <StaffPortal />
              </StaffProtected>
            }
          />

          {/* ── Legacy /portal redirect → role-based destination ── */}
          <Route path="/portal" element={<PortalRedirect />} />
          <Route path="/portal/*" element={<PortalRedirect />} />

          {/* ── Catch-all ── */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AnimatePresence>
    </AuthContext.Provider>
  );
}

/** Redirect old /portal links to the appropriate role-based destination */
function PortalRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === "admin") return <Navigate to="/admin" replace />;
  if (user.role === "staff") return <Navigate to="/staff" replace />;
  return <Navigate to="/account" replace />;
}
