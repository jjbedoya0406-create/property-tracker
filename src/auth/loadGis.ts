const GIS_SCRIPT_SRC = "https://accounts.google.com/gsi/client";

let loadPromise: Promise<void> | null = null;

// Loads the Google Identity Services script exactly once, idempotently —
// safe to call from multiple components (e.g. sign-in button, silent
// re-auth check) without injecting duplicate <script> tags.
export function loadGoogleIdentityServices(): Promise<void> {
  if (window.google?.accounts?.oauth2) {
    return Promise.resolve();
  }

  if (!loadPromise) {
    loadPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = GIS_SCRIPT_SRC;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => {
        loadPromise = null;
        reject(new Error("Failed to load Google Identity Services script"));
      };
      document.head.appendChild(script);
    });
  }

  return loadPromise;
}
