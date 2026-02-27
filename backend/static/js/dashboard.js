(function () {
  const els = {
    userEmail: document.getElementById("user-email"),
    creditBalance: document.getElementById("credit-balance"),
    logoutBtn: document.getElementById("logout-btn"),

    processLinkForm: document.getElementById("process-link-form"),
    videoUrlInput: document.getElementById("video-url-input"),
    submitLinkBtn: document.getElementById("submit-link-btn"),
    processStatus: document.getElementById("process-status"),

    progressTracker: document.getElementById("progress-tracker"),
    progressPct: document.getElementById("progress-pct"),
    progressFill: document.getElementById("progress-fill"),
    progressStatus: document.getElementById("progress-status"),

    clipsGrid: document.getElementById("clips-grid"),
    clipsEmpty: document.getElementById("clips-empty"),
  };

  let state = { credits: 0 };
  let progressInterval = null;

  // ── Progress bar ──

  function showProgress(message) {
    els.processStatus.style.display = "none";
    els.progressTracker.style.display = "block";
    els.progressStatus.textContent = message;
    els.progressFill.style.width = "0%";
    els.progressPct.textContent = "0%";

    let progress = 0;
    clearInterval(progressInterval);
    progressInterval = setInterval(() => {
      if (progress < 95) {
        const increment = Math.random() * (95 - progress) * 0.08;
        progress = Math.min(95, progress + Math.max(0.5, increment));
        els.progressFill.style.width = `${Math.floor(progress)}%`;
        els.progressPct.textContent = `${Math.floor(progress)}%`;

        if (progress > 15 && progress < 40) els.progressStatus.textContent = "Transcribing audio with Whisper...";
        if (progress >= 40 && progress < 70) els.progressStatus.textContent = "AI detecting viral moments...";
        if (progress >= 70 && progress < 90) els.progressStatus.textContent = "Tracking speaker & cropping to 9:16...";
        if (progress >= 90) els.progressStatus.textContent = "Finalizing clips...";
      }
    }, 800);
  }

  function hideProgress() {
    clearInterval(progressInterval);
    els.progressTracker.style.display = "none";
  }

  function showStatus(message, type) {
    hideProgress();
    els.processStatus.style.display = "block";
    els.processStatus.textContent = message || "";
    els.processStatus.className = "status-msg " + (type === "success" ? "text-success" : "text-error");
  }

  // ── Clips rendering ──

  function formatDate(v) {
    const d = new Date(v);
    return Number.isNaN(d.valueOf()) ? "-" : d.toLocaleDateString();
  }

  function formatDuration(s) {
    if (!s) return "-";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${String(sec).padStart(2, "0")}`;
  }

  function renderClips(items) {
    els.clipsGrid.innerHTML = "";
    if (!items.length) { els.clipsEmpty.hidden = false; return; }
    els.clipsEmpty.hidden = true;

    items.forEach((clip) => {
      const card = document.createElement("article");
      card.className = "clip-card";

      const thumb = document.createElement("img");
      thumb.src = clip.thumbnail_path || "https://placehold.co/540x960/f1f5f9/94a3b8?text=Clip";
      thumb.alt = "Clip thumbnail";
      thumb.loading = "lazy";

      const body = document.createElement("div");
      body.className = "clip-card-body";

      const top = document.createElement("div");
      top.className = "clip-card-top";

      const platform = document.createElement("span");
      platform.className = "platform-badge";
      platform.textContent = (clip.platform || "youtube").toUpperCase();

      const duration = document.createElement("span");
      duration.className = "muted text-sm";
      duration.textContent = formatDuration(clip.duration);

      top.appendChild(platform);
      top.appendChild(duration);

      const meta = document.createElement("p");
      meta.className = "muted text-sm";
      meta.textContent = formatDate(clip.created_at);

      const actions = document.createElement("div");
      actions.className = "clip-actions";

      const download = document.createElement("a");
      download.href = clip.storage_path;
      download.target = "_blank";
      download.rel = "noopener noreferrer";
      download.className = "btn secondary";
      download.textContent = "Download";

      const remove = document.createElement("button");
      remove.className = "btn ghost";
      remove.textContent = "Delete";
      remove.addEventListener("click", async () => {
        remove.disabled = true;
        try {
          await window.ClipperSDK.apiFetch(`/clips/${clip.clip_id}`, { method: "DELETE" });
          await loadClips();
        } catch (err) {
          showStatus(err.message || "Delete failed.", "error");
        } finally {
          remove.disabled = false;
        }
      });

      actions.appendChild(download);
      actions.appendChild(remove);
      body.appendChild(top);
      body.appendChild(meta);
      body.appendChild(actions);
      card.appendChild(thumb);
      card.appendChild(body);
      els.clipsGrid.appendChild(card);
    });
  }

  // ── API calls ──

  async function loadClips() {
    const data = await window.ClipperSDK.apiFetch("/clips?page=1&page_size=24");
    renderClips(data.items || []);
  }

  async function loadProfile() {
    const payload = await window.ClipperSDK.apiFetch("/user/profile");
    const profile = payload.profile;
    els.userEmail.textContent = payload.user.email || "Unknown";
    state.credits = profile.credit_balance || 0;
    els.creditBalance.textContent = `${state.credits} credit${state.credits !== 1 ? "s" : ""}`;
    els.creditBalance.className = state.credits > 0 ? "badge badge-success" : "badge badge-neutral";
  }

  async function processLink(e) {
    if (e) e.preventDefault();
    const url = els.videoUrlInput.value.trim();
    if (!url) return;

    if (state.credits < 1) {
      showStatus("No credits remaining. Purchase a package to continue.", "error");
      return;
    }

    els.submitLinkBtn.disabled = true;
    showProgress("Downloading video...");

    try {
      await window.ClipperSDK.apiFetch("/clips/process", {
        method: "POST",
        body: JSON.stringify({ video_url: url }),
      });

      // Flash to 100%
      els.progressFill.style.width = "100%";
      els.progressPct.textContent = "100%";
      els.progressStatus.textContent = "Done! Clips are ready.";
      setTimeout(() => {
        hideProgress();
        showStatus("✓ Clips generated successfully!", "success");
      }, 1200);

      els.videoUrlInput.value = "";
      await loadProfile();
      await loadClips();
    } catch (err) {
      showStatus(err.message || "Failed to process link.", "error");
    } finally {
      els.submitLinkBtn.disabled = false;
    }
  }

  // ── Boot ──

  async function boot() {
    const session = await window.ClipperSDK.requireSession("/auth.html");
    if (!session) return;

    els.processLinkForm.addEventListener("submit", processLink);
    els.logoutBtn.addEventListener("click", window.ClipperSDK.logout);

    try {
      await loadProfile();
      await loadClips();

      // Auto-refresh every 10 seconds
      setInterval(async () => {
        await loadProfile();
        await loadClips();
      }, 10000);
    } catch (err) {
      showStatus(err.message || "Failed to load dashboard.", "error");
    }
  }

  boot();
})();
