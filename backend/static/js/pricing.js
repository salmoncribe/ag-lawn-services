(function () {
  const checkoutButtons = document.querySelectorAll("[data-checkout-plan]");
  const status = document.getElementById("pricing-status");

  function setStatus(message, type) {
    if (!status) return;
    status.textContent = message || "";
    status.dataset.type = type || "neutral";
  }

  checkoutButtons.forEach((button) => {
    button.addEventListener("click", async () => {
      const plan = button.dataset.checkoutPlan;
      button.disabled = true;
      setStatus("Creating checkout session...", "neutral");

      try {
        const session = await window.ClipperSDK.getSession();
        if (!session) {
          window.location.href = `/auth.html?plan=${encodeURIComponent(plan)}`;
          return;
        }

        const result = await window.ClipperSDK.apiFetch("/billing/checkout", {
          method: "POST",
          body: JSON.stringify({ plan_tier: plan }),
        });

        window.location.href = result.checkout_url;
      } catch (error) {
        setStatus(error.message || "Unable to start checkout.", "error");
      } finally {
        button.disabled = false;
      }
    });
  });
})();
