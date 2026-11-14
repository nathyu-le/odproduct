/** The startup overlay is outside React and only runs on full page loads. */
export function signalContentReady() {
  const splash = document.getElementById("od-splash");
  if (!splash) return;
  // The app remains usable if the small independent startup script is blocked.
  if (splash.dataset.managed !== "true") {
    splash.remove();
    return;
  }
  window.dispatchEvent(new Event("od:content-ready"));
}
