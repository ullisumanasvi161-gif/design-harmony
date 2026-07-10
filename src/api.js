const API = "/api";

function token() {
  return localStorage.getItem("dh-token");
}

export async function request(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  if (!(options.body instanceof FormData)) headers["Content-Type"] = "application/json";
  if (token()) headers.Authorization = `Bearer ${token()}`;
  const response = await fetch(`${API}${path}`, { ...options, headers });
  const data = await response.json().catch(() => ({}));
  if (response.status === 401 && typeof window !== "undefined") {
    window.dispatchEvent(new Event("dh-unauthorized"));
  }
  if (!response.ok) throw new Error(data.message || "Request failed");
  return data;
}

export const api = {
  login: (body) => request("/auth/login", { method: "POST", body: JSON.stringify(body) }),
  register: (body) => request("/auth/register", { method: "POST", body: JSON.stringify(body) }),
  publicContent: () => request("/public"),
  dashboard: () => request("/dashboard"),
  booking: (body) =>
    request("/bookings", {
      method: "POST",
      body: body instanceof FormData ? body : JSON.stringify(body)
    }),
  contact: (body) => request("/contacts", { method: "POST", body: JSON.stringify(body) }),
  createProject: (body) => request("/projects", { method: "POST", body: JSON.stringify(body) }),
  createService: (body) => request("/services", { method: "POST", body }),
  updateServiceImage: (id, body) =>
    request(`/services/${id}/image`, { method: "PATCH", body }),
  addServiceWorkPhotos: (id, body) =>
    request(`/services/${id}/gallery`, { method: "POST", body }),
  updateProject: (id, body) =>
    request(`/projects/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  updateBooking: (id, body) =>
    request(`/bookings/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  addUpdate: (body) => request("/updates", { method: "POST", body: JSON.stringify(body) }),
  invoice: (id) => request(`/invoice/${id}`),
  update3DPhoto: (room, body) => request(`/settings/3d-photo/${encodeURIComponent(room)}`, { method: "POST", body }),
  updateProjectImage: (projectName, body) => request(`/settings/project-image/${encodeURIComponent(projectName)}`, { method: "POST", body }),
  createUser: (body) => request("/users", { method: "POST", body: JSON.stringify(body) }),
  createPayment: (body) => request("/payments", { method: "POST", body: JSON.stringify(body) }),
  updatePayment: (id, body) => request(`/payments/${id}`, { method: "PATCH", body: JSON.stringify(body) })
};
