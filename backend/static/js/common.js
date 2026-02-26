(function () {
  const cfg = window.CLIPPER_CONFIG || {};
  const configured = Boolean(
    cfg.supabaseUrl &&
      cfg.supabaseAnonKey &&
      cfg.supabaseUrl !== "YOUR_SUPABASE_URL" &&
      cfg.supabaseAnonKey !== "YOUR_SUPABASE_ANON_KEY"
  );

  const supabaseClient = configured
    ? window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey)
    : null;

  async function getSession() {
    if (!supabaseClient) {
      return null;
    }
    const { data } = await supabaseClient.auth.getSession();
    return data.session;
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
    if (!supabaseClient) return;
    await supabaseClient.auth.signOut();
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

  function getClient() {
    return supabaseClient;
  }

  window.ClipperSDK = {
    configured,
    getClient,
    getSession,
    requireSession,
    logout,
    apiFetch,
  };
})();
