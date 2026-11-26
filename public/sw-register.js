(function () {
  if (!("serviceWorker" in navigator)) return;
  window.addEventListener("load", function () {
    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then(function (reg) {
        console.log("[DigiTools] Service Worker registered:", reg.scope);
        setInterval(function () {
          reg.update();
        }, 3600000);
      })
      .catch(function (err) {
        console.warn("[DigiTools] SW registration failed:", err);
      });
  });
})();
