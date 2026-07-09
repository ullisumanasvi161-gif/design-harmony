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
import Auth from "./pages/Auth";
import Portal from "./pages/Portal";

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

function Protected({ children, roles = [] }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (roles.length && !roles.includes(user.role)) return <Navigate to="/consultation" replace />;
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
  const [theme, setTheme] = useState("light");

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
    [user, theme]
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
          <Route element={<PublicLayout />}>
            <Route index element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/services" element={<Services />} />
            <Route path="/projects" element={<Portfolio />} />
            <Route path="/design-planner" element={<DesignPlanner />} />
            <Route path="/consultation" element={<Consultation />} />
            <Route path="/contact" element={<Contact />} />
          </Route>
          <Route path="/login" element={<Auth />} />
          <Route
            path="/portal/*"
            element={
              <Protected roles={["admin", "staff"]}>
                <Portal />
              </Protected>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AnimatePresence>
    </AuthContext.Provider>
  );
}
