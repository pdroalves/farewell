import { FhevmRelayerSDKType, FhevmWindowType } from "./fhevmTypes";
import { getSDKCDNUrl, getBasePath } from "./constants";

type TraceType = (message?: unknown, ...optionalParams: unknown[]) => void;

export class RelayerSDKLoader {
  private _trace?: TraceType;
  private _wasmPatchApplied = false;

  constructor(options: { trace?: TraceType }) {
    this._trace = options.trace;
  }

  /**
   * Patch WebAssembly loading to account for basePath
   * The SDK bundle uses absolute paths like "/tfhe_bg.wasm" which don't work with basePath
   */
  private _patchWasmLoading(): void {
    if (this._wasmPatchApplied) {
      return;
    }
    this._wasmPatchApplied = true;

    const basePath = getBasePath();
    if (!basePath) {
      // No basePath, no patching needed
      return;
    }

    // Patch WebAssembly.instantiateStreaming to rewrite WASM paths
    const originalInstantiateStreaming = WebAssembly.instantiateStreaming;
    WebAssembly.instantiateStreaming = async (
      source: Response | Promise<Response>,
      importObject?: WebAssembly.Imports
    ) => {
      let response: Response;
      if (source instanceof Promise) {
        response = await source;
      } else {
        response = source;
      }

      // Check if this is a WASM file request that needs basePath
      const url = response.url;
      if (url && (url.endsWith(".wasm") || url.includes(".wasm"))) {
        // If the URL doesn't already have the basePath, we need to fetch it with basePath
        if (!url.includes(basePath)) {
          const wasmPath = url.replace(window.location.origin, "").replace(/^\//, "");
          const newUrl = `${basePath}/${wasmPath}`;
          console.log(`[RelayerSDKLoader] Rewriting WASM path: ${url} -> ${newUrl}`);
          response = await fetch(newUrl);
        }
      }

      return originalInstantiateStreaming.call(WebAssembly, response, importObject);
    };

    // Also patch fetch for WASM files as a fallback
    const originalFetch = window.fetch;
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      let url: string | undefined;
      if (typeof input === "string") {
        url = input;
      } else if (input instanceof URL) {
        url = input.href;
      } else if (input instanceof Request) {
        url = input.url;
      }
      
      // Check if this is a WASM file request
      if (url && (url.endsWith(".wasm") || url.includes(".wasm"))) {
        // If it's an absolute path starting with "/" and doesn't have basePath, add it
        // Also handle full URLs that point to the same origin
        const urlObj = new URL(url, window.location.origin);
        if (urlObj.pathname.startsWith("/") && !urlObj.pathname.startsWith(basePath)) {
          const newPath = `${basePath}${urlObj.pathname}`;
          const newUrl = urlObj.origin + newPath + urlObj.search + urlObj.hash;
          console.log(`[RelayerSDKLoader] Rewriting WASM fetch: ${url} -> ${newUrl}`);
          
          // Create new request with updated URL
          if (input instanceof Request) {
            return originalFetch.call(window, new Request(newUrl, input), init);
          } else if (input instanceof URL) {
            return originalFetch.call(window, new URL(newUrl), init);
          } else {
            return originalFetch.call(window, newUrl, init);
          }
        }
      }
      
      return originalFetch.call(window, input, init);
    };
  }

  public isLoaded() {
    if (typeof window === "undefined") {
      throw new Error("RelayerSDKLoader: can only be used in the browser.");
    }
    return isFhevmWindowType(window, this._trace);
  }

  public load(): Promise<void> {
    console.log("[RelayerSDKLoader] load...");
    // Ensure this only runs in the browser
    if (typeof window === "undefined") {
      console.log("[RelayerSDKLoader] window === undefined");
      return Promise.reject(
        new Error("RelayerSDKLoader: can only be used in the browser.")
      );
    }

    // Patch WASM loading to account for basePath
    // The SDK bundle uses absolute paths like "/tfhe_bg.wasm" which don't work with basePath
    this._patchWasmLoading();

    if ("relayerSDK" in window) {
      if (!isFhevmRelayerSDKType(window.relayerSDK, this._trace)) {
        console.log("[RelayerSDKLoader] window.relayerSDK === undefined");
        throw new Error("RelayerSDKLoader: Unable to load FHEVM Relayer SDK");
      }
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const sdkUrl = getSDKCDNUrl();
      const existingScript = document.querySelector(
        `script[src="${sdkUrl}"]`
      );
      if (existingScript) {
        if (!isFhevmWindowType(window, this._trace)) {
          reject(
            new Error(
              "RelayerSDKLoader: window object does not contain a valid relayerSDK object."
            )
          );
        }
        resolve();
        return;
      }

      const script = document.createElement("script");
      script.src = sdkUrl;
      script.type = "text/javascript";
      script.async = true;

      script.onload = () => {
        if (!isFhevmWindowType(window, this._trace)) {
          console.log("[RelayerSDKLoader] script onload FAILED...");
          reject(
            new Error(
              `RelayerSDKLoader: Relayer SDK script has been successfully loaded from ${sdkUrl}, however, the window.relayerSDK object is invalid.`
            )
          );
        }
        resolve();
      };

      script.onerror = (error) => {
        console.log("[RelayerSDKLoader] script onerror... ", error);
        reject(
          new Error(
            `RelayerSDKLoader: Failed to load Relayer SDK from ${sdkUrl}`
          )
        );
      };

      console.log("[RelayerSDKLoader] add script to DOM...");
      document.head.appendChild(script);
      console.log("[RelayerSDKLoader] script added!")
    });
  }
}

function isFhevmRelayerSDKType(
  o: unknown,
  trace?: TraceType
): o is FhevmRelayerSDKType {
  if (typeof o === "undefined") {
    trace?.("RelayerSDKLoader: relayerSDK is undefined");
    return false;
  }
  if (o === null) {
    trace?.("RelayerSDKLoader: relayerSDK is null");
    return false;
  }
  if (typeof o !== "object") {
    trace?.("RelayerSDKLoader: relayerSDK is not an object");
    return false;
  }
  if (!objHasProperty(o, "initSDK", "function", trace)) {
    trace?.("RelayerSDKLoader: relayerSDK.initSDK is invalid");
    return false;
  }
  if (!objHasProperty(o, "createInstance", "function", trace)) {
    trace?.("RelayerSDKLoader: relayerSDK.createInstance is invalid");
    return false;
  }
  if (!objHasProperty(o, "SepoliaConfig", "object", trace)) {
    trace?.("RelayerSDKLoader: relayerSDK.SepoliaConfig is invalid");
    return false;
  }
  if ("__initialized__" in o) {
    if (o.__initialized__ !== true && o.__initialized__ !== false) {
      trace?.("RelayerSDKLoader: relayerSDK.__initialized__ is invalid");
      return false;
    }
  }
  return true;
}

export function isFhevmWindowType(
  win: unknown,
  trace?: TraceType
): win is FhevmWindowType {
  if (typeof win === "undefined") {
    trace?.("RelayerSDKLoader: window object is undefined");
    return false;
  }
  if (win === null) {
    trace?.("RelayerSDKLoader: window object is null");
    return false;
  }
  if (typeof win !== "object") {
    trace?.("RelayerSDKLoader: window is not an object");
    return false;
  }
  if (!("relayerSDK" in win)) {
    trace?.("RelayerSDKLoader: window does not contain 'relayerSDK' property");
    return false;
  }
  return isFhevmRelayerSDKType(win.relayerSDK);
}

function objHasProperty<
  T extends object,
  K extends PropertyKey,
  V extends string // "string", "number", etc.
>(
  obj: T,
  propertyName: K,
  propertyType: V,
  trace?: TraceType
): obj is T &
  Record<
    K,
    V extends "string"
      ? string
      : V extends "number"
      ? number
      : V extends "object"
      ? object
      : V extends "boolean"
      ? boolean
      : V extends "function"
      ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (...args: any[]) => any
      : unknown
  > {
  if (!obj || typeof obj !== "object") {
    return false;
  }

  if (!(propertyName in obj)) {
    trace?.(`RelayerSDKLoader: missing ${String(propertyName)}.`);
    return false;
  }

  const value = (obj as Record<K, unknown>)[propertyName];

  if (value === null || value === undefined) {
    trace?.(`RelayerSDKLoader: ${String(propertyName)} is null or undefined.`);
    return false;
  }

  if (typeof value !== propertyType) {
    trace?.(
      `RelayerSDKLoader: ${String(propertyName)} is not a ${propertyType}.`
    );
    return false;
  }

  return true;
}
