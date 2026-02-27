(function () {
  const checkoutButtons = document.querySelectorAll("[data-checkout-package]");
  const status = document.getElementById("pricing-status");

  function setStatus(message, type) {
    if (!status) return;
    status.textContent = message || "";
    status.dataset.type = type || "neutral";
  }

  checkoutButtons.forEach((button) => {
    button.addEventListener("click", async () => {
      const packageId = button.dataset.checkoutPackage;
      button.disabled = true;
      setStatus("Creating checkout session...", "neutral");

      try {
        const session = await window.ClipperSDK.getSession();
        if (!session) {
          window.location.href = `/auth.html?package=${encodeURIComponent(packageId)}`;
          return;
        }

        const result = await window.ClipperSDK.apiFetch("/billing/checkout", {
          method: "POST",
          body: JSON.stringify({ package_id: packageId }),
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
