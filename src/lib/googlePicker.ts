// Minimal wrapper for the Google Picker API
// (https://apis.google.com/js/api.js + gapi.load('picker', ...)), which
// attaches `window.gapi` and `window.google.picker` at runtime rather than
// being an installed package. Used to connect to a portfolio someone else
// owns (issue #3) — drive.file scope only grants access to a file an
// account created itself or explicitly selected through this Picker, so
// this is the mechanism that bridges "shared with me" into "this app can
// actually read it." See docs/google-cloud-setup.md for the required
// VITE_GOOGLE_PICKER_API_KEY setup. Confirmed working via a throwaway
// spike before this was promoted to real code.

export interface PickerDoc {
  id: string;
  name: string;
  mimeType: string;
}

export interface PickerResponse {
  action: string;
  docs?: PickerDoc[];
}

interface PickerInstance {
  setVisible: (visible: boolean) => void;
}

interface PickerBuilder {
  addView: (viewId: string) => PickerBuilder;
  setOAuthToken: (token: string) => PickerBuilder;
  setDeveloperKey: (key: string) => PickerBuilder;
  setCallback: (
    callback: (response: PickerResponse) => void,
  ) => PickerBuilder;
  build: () => PickerInstance;
}

interface PickerNamespace {
  PickerBuilder: new () => PickerBuilder;
  ViewId: { SPREADSHEETS: string };
  Action: { PICKED: string };
}

interface GapiGlobal {
  load: (module: string, callback: () => void) => void;
}

// Deliberately NOT a `declare global` augmentation of `Window.google` —
// that already has a shape from src/auth/gis-types.ts, and merging a
// second incompatible declaration for the same property across files
// doesn't type-check. Cast at the access points instead.
function getGapi(): GapiGlobal | undefined {
  return (window as unknown as { gapi?: GapiGlobal }).gapi;
}

function getPickerNamespaceUnsafe(): PickerNamespace | undefined {
  return (window as unknown as { google?: { picker?: PickerNamespace } })
    .google?.picker;
}

const GAPI_SCRIPT_SRC = "https://apis.google.com/js/api.js";

let loadPromise: Promise<void> | null = null;

// Loads the gapi bootstrap script, then the 'picker' module from it,
// exactly once — safe to call every time a "Connect a portfolio" flow
// starts.
export function loadGooglePicker(): Promise<void> {
  if (getGapi()) {
    return new Promise((resolve) => {
      getGapi()!.load("picker", () => resolve());
    });
  }

  if (!loadPromise) {
    loadPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = GAPI_SCRIPT_SRC;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        const gapi = getGapi();
        if (!gapi) {
          reject(new Error("gapi failed to attach to window"));
          return;
        }
        gapi.load("picker", () => resolve());
      };
      script.onerror = () => {
        loadPromise = null;
        reject(new Error("Failed to load Google API script"));
      };
      document.head.appendChild(script);
    });
  }

  return loadPromise;
}

// Opens the Picker, scoped to spreadsheets, and resolves with the picked
// file's id/name — or null if the user cancelled. Call loadGooglePicker()
// first.
export function pickSpreadsheet(
  accessToken: string,
  apiKey: string,
): Promise<PickerDoc | null> {
  const namespace = getPickerNamespaceUnsafe();
  if (!namespace) {
    throw new Error(
      "google.picker not loaded — call loadGooglePicker() first",
    );
  }

  return new Promise((resolve) => {
    new namespace.PickerBuilder()
      .addView(namespace.ViewId.SPREADSHEETS)
      .setOAuthToken(accessToken)
      .setDeveloperKey(apiKey)
      .setCallback((response) => {
        if (response.action !== namespace.Action.PICKED) {
          resolve(null);
          return;
        }
        resolve(response.docs?.[0] ?? null);
      })
      .build()
      .setVisible(true);
  });
}
