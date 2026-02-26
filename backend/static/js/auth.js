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
    statusEl.dataset.type = type || "neutral";
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

    if (!window.ClipperSDK.configured) {
      setStatus("Set Supabase keys in static/js/config.js first.", "error");
      return;
    }

    const client = window.ClipperSDK.getClient();
    const email = emailInput.value.trim();
    const password = passwordInput.value;

    submitBtn.disabled = true;
    setStatus("Working...", "neutral");

    try {
      if (mode === "signup") {
        const { data, error } = await client.auth.signUp({ email, password });
        if (error) throw error;

        if (!data.session) {
          setStatus("Check your email to confirm your account, then sign in.", "success");
        } else {
          window.location.href = "/dashboard.html";
        }
      } else {
        const { error } = await client.auth.signInWithPassword({ email, password });
        if (error) throw error;
        window.location.href = "/dashboard.html";
      }
    } catch (error) {
      setStatus(error.message || "Authentication failed.", "error");
    } finally {
      submitBtn.disabled = false;
    }
  });

  setMode("login");
})();
