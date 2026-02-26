(function () {
  const els = {
    userEmail: document.getElementById("user-email"),
    planTier: document.getElementById("plan-tier"),
    billingBtn: document.getElementById("manage-billing-btn"),
    logoutBtn: document.getElementById("logout-btn"),

    twitchStatus: document.getElementById("twitch-status"),
    kickStatus: document.getElementById("kick-status"),
    twitchLogin: document.getElementById("twitch-login"),
    kickChannel: document.getElementById("kick-channel"),

    connectTwitchBtn: document.getElementById("connect-twitch-btn"),
    disconnectTwitchBtn: document.getElementById("disconnect-twitch-btn"),
    connectKickBtn: document.getElementById("connect-kick-btn"),
    disconnectKickBtn: document.getElementById("disconnect-kick-btn"),

    keywordInput: document.getElementById("keyword-input"),
    addKeywordBtn: document.getElementById("add-keyword-btn"),
    keywordList: document.getElementById("keyword-list"),
    thresholdSlider: document.getElementById("threshold-slider"),
    thresholdValue: document.getElementById("threshold-value"),
    watermarkInput: document.getElementById("watermark-input"),
    saveSettingsBtn: document.getElementById("save-settings-btn"),

    clipsGrid: document.getElementById("clips-grid"),
    clipsEmpty: document.getElementById("clips-empty"),

    status: document.getElementById("dashboard-status"),
  };

  let state = {
    keywords: [],
  };

  function setStatus(message, type) {
    els.status.textContent = message || "";
    els.status.dataset.type = type || "neutral";
  }

  function renderKeywords() {
    els.keywordList.innerHTML = "";

    if (!state.keywords.length) {
      const empty = document.createElement("span");
      empty.className = "muted";
      empty.textContent = "No keywords set.";
      els.keywordList.appendChild(empty);
      return;
    }

    state.keywords.forEach((keyword) => {
      const item = document.createElement("div");
      item.className = "keyword-chip";

      const label = document.createElement("span");
      label.textContent = keyword;

      const removeBtn = document.createElement("button");
      removeBtn.type = "button";
      removeBtn.textContent = "x";
      removeBtn.addEventListener("click", () => {
        state.keywords = state.keywords.filter((kw) => kw !== keyword);
        renderKeywords();
      });

      item.appendChild(label);
      item.appendChild(removeBtn);
      els.keywordList.appendChild(item);
    });
  }

  function addKeyword(raw) {
    const keyword = (raw || "").trim().toLowerCase();
    if (!keyword || state.keywords.includes(keyword)) return;
    state.keywords.push(keyword);
    state.keywords.sort();
    renderKeywords();
  }

  function statusClass(status) {
    if (status === "connected") return "badge-success";
    if (status === "expired") return "badge-warning";
    return "badge-muted";
  }

  function formatDate(value) {
    const date = new Date(value);
    if (Number.isNaN(date.valueOf())) return "-";
    return date.toLocaleString();
  }

  function formatDuration(seconds) {
    if (!seconds) return "-";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${String(secs).padStart(2, "0")}`;
  }

  function renderClips(items) {
    els.clipsGrid.innerHTML = "";

    if (!items.length) {
      els.clipsEmpty.hidden = false;
      return;
    }

    els.clipsEmpty.hidden = true;

    items.forEach((clip) => {
      const card = document.createElement("article");
      card.className = "clip-card";

      const thumb = document.createElement("img");
      thumb.src = clip.thumbnail_url || "https://placehold.co/540x960?text=ClipperAI";
      thumb.alt = "Clip thumbnail";
      thumb.loading = "lazy";

      const body = document.createElement("div");
      body.className = "clip-card-body";

      const top = document.createElement("div");
      top.className = "clip-card-top";

      const platform = document.createElement("span");
      platform.className = "platform-badge";
      platform.textContent = (clip.platform || "stream").toUpperCase();

      const duration = document.createElement("span");
      duration.className = "muted";
      duration.textContent = formatDuration(clip.duration);

      top.appendChild(platform);
      top.appendChild(duration);

      const meta = document.createElement("p");
      meta.className = "muted";
      meta.textContent = formatDate(clip.created_at);

      const actions = document.createElement("div");
      actions.className = "clip-actions";

      const download = document.createElement("a");
      download.href = clip.storage_url;
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
        } catch (error) {
          setStatus(error.message || "Delete failed.", "error");
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

  async function loadClips() {
    const clips = await window.ClipperSDK.apiFetch("/clips?page=1&page_size=24");
    renderClips(clips.items || []);
  }

  async function loadProfile() {
    const payload = await window.ClipperSDK.apiFetch("/user/profile");
    const profile = payload.profile;

    els.userEmail.textContent = payload.user.email || "Unknown";
    els.planTier.textContent = (profile.plan_tier || "basic").toUpperCase();

    els.twitchStatus.textContent = profile.twitch.status;
    els.twitchStatus.className = `badge ${statusClass(profile.twitch.status)}`;
    els.twitchLogin.textContent = profile.twitch.login || "Not connected";

    els.kickStatus.textContent = profile.kick.status;
    els.kickStatus.className = `badge ${statusClass(profile.kick.status)}`;
    els.kickChannel.textContent = profile.kick.channel_name || "Not connected";

    state.keywords = Array.isArray(profile.keyword_triggers)
      ? [...profile.keyword_triggers]
      : [];
    renderKeywords();

    els.thresholdSlider.value = profile.chat_spike_threshold || 20;
    els.thresholdValue.textContent = String(profile.chat_spike_threshold || 20);
    els.watermarkInput.value = profile.watermark_text || "";
  }

  async function saveSettings() {
    els.saveSettingsBtn.disabled = true;

    try {
      await window.ClipperSDK.apiFetch("/user/settings", {
        method: "PUT",
        body: JSON.stringify({
          keyword_triggers: state.keywords,
          chat_spike_threshold: Number(els.thresholdSlider.value),
          watermark_text: els.watermarkInput.value.trim(),
        }),
      });
      setStatus("Settings saved.", "success");
    } catch (error) {
      setStatus(error.message || "Unable to save settings.", "error");
    } finally {
      els.saveSettingsBtn.disabled = false;
    }
  }

  async function connectTwitch() {
    try {
      const result = await window.ClipperSDK.apiFetch("/auth/twitch/start");
      window.location.href = result.url;
    } catch (error) {
      setStatus(error.message || "Unable to connect Twitch.", "error");
    }
  }

  async function connectKick() {
    const channelName = window.prompt("Kick channel name");
    if (!channelName) return;

    const apiKey = window.prompt("Kick API key");
    if (!apiKey) return;

    try {
      await window.ClipperSDK.apiFetch("/user/connect/kick", {
        method: "PUT",
        body: JSON.stringify({ channel_name: channelName, api_key: apiKey }),
      });
      setStatus("Kick connected.", "success");
      await loadProfile();
    } catch (error) {
      setStatus(error.message || "Unable to connect Kick.", "error");
    }
  }

  async function disconnect(path) {
    try {
      await window.ClipperSDK.apiFetch(path, { method: "DELETE" });
      await loadProfile();
    } catch (error) {
      setStatus(error.message || "Unable to disconnect.", "error");
    }
  }

  async function openBillingPortal() {
    try {
      const result = await window.ClipperSDK.apiFetch("/billing/portal", {
        method: "POST",
      });
      window.location.href = result.portal_url;
    } catch (error) {
      setStatus(error.message || "Unable to open billing portal.", "error");
    }
  }

  async function boot() {
    const session = await window.ClipperSDK.requireSession("/auth.html");
    if (!session) return;

    els.thresholdSlider.addEventListener("input", () => {
      els.thresholdValue.textContent = els.thresholdSlider.value;
    });

    els.addKeywordBtn.addEventListener("click", () => {
      addKeyword(els.keywordInput.value);
      els.keywordInput.value = "";
    });

    els.keywordInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        addKeyword(els.keywordInput.value);
        els.keywordInput.value = "";
      }
    });

    els.saveSettingsBtn.addEventListener("click", saveSettings);
    els.connectTwitchBtn.addEventListener("click", connectTwitch);
    els.connectKickBtn.addEventListener("click", connectKick);
    els.disconnectTwitchBtn.addEventListener("click", () => disconnect("/user/connect/twitch"));
    els.disconnectKickBtn.addEventListener("click", () => disconnect("/user/connect/kick"));
    els.billingBtn.addEventListener("click", openBillingPortal);
    els.logoutBtn.addEventListener("click", window.ClipperSDK.logout);

    try {
      await loadProfile();
      await loadClips();
    } catch (error) {
      setStatus(error.message || "Failed loading dashboard.", "error");
    }
  }

  boot();
})();
