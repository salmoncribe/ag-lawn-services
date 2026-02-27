(function () {
  const cfg = window.CLIPPER_CONFIG || {};

  async function getSession() {
    const token = localStorage.getItem("clipper_token");
    if (!token) return null;
    return { access_token: token };
  }

  async function requireSession(redirectTo) {
    const session = await getSession();
    if (!session) {
      window.location.href = redirectTo || "/auth.html";
      return null;
    }
    return session;
  }

  async function logout() {
    localStorage.removeItem("clipper_token");
    window.location.href = "/auth.html";
  }

  async function apiFetch(path, options = {}) {
    const session = await getSession();
    const headers = Object.assign({}, options.headers || {});

    if (!(options.body instanceof FormData) && !headers["Content-Type"]) {
      headers["Content-Type"] = "application/json";
    }

    if (session?.access_token) {
      headers.Authorization = `Bearer ${session.access_token}`;
    }

    const response = await fetch(`${cfg.apiBase}${path}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      const message = payload.detail || payload.error || "Request failed";
      throw new Error(message);
    }

    return response.json();
  }

  window.ClipperSDK = {
    configured: true,
    getSession,
    requireSession,
    logout,
    apiFetch,
  };
})();
