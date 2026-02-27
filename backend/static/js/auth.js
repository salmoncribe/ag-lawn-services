(function () {
  const modeButtons = document.querySelectorAll("[data-mode]");
  const form = document.getElementById("auth-form");
  const submitBtn = document.getElementById("auth-submit");
  const modeTitle = document.getElementById("auth-mode-title");
  const statusEl = document.getElementById("auth-status");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");

  let mode = "login";

  function setStatus(message, type) {
    statusEl.textContent = message;
    statusEl.className = "status-msg " + (type === "error" ? "text-error" : type === "success" ? "text-success" : "muted");
  }

  function setMode(nextMode) {
    mode = nextMode;
    modeButtons.forEach((button) => {
      button.classList.toggle("active", button.dataset.mode === mode);
    });

    if (mode === "signup") {
      modeTitle.textContent = "Create your ClipperAI account";
      submitBtn.textContent = "Create account";
    } else {
      modeTitle.textContent = "Sign in to your ClipperAI account";
      submitBtn.textContent = "Sign in";
    }
    setStatus("", "neutral");
  }

  modeButtons.forEach((button) => {
    button.addEventListener("click", () => setMode(button.dataset.mode));
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    submitBtn.disabled = true;
    setStatus("Working...", "neutral");

    try {
      const endpoint = mode === "signup" ? "/auth/signup" : "/auth/login";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "Authentication failed.");
      }

      if (data.session && data.session.access_token) {
        localStorage.setItem("clipper_token", data.session.access_token);
        window.location.href = "/dashboard.html";
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (error) {
      setStatus(error.message || "Authentication failed.", "error");
    } finally {
      submitBtn.disabled = false;
    }
  });

  setMode("login");
})();
