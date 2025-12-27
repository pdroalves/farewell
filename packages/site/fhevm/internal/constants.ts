// Use local SDK bundle (from npm @zama-fhe/relayer-sdk 0.3.x)
// instead of CDN (which only has outdated 0.2.0 with wrong addresses)
// Account for basePath in production (next.config.js sets basePath: '/farewell' in prod)

/**
 * Get the basePath for static assets in production
 * Detects from window.location.pathname at runtime
 */
export function getBasePath(): string {
  if (typeof window === "undefined") {
    // Server-side: use build-time detection
    return process.env.NODE_ENV === "production" ? "/farewell" : "";
  }
  // Client-side: detect from current pathname
  // If we're at /farewell/..., the basePath is /farewell
  const pathname = window.location.pathname;
  if (pathname.startsWith("/farewell")) {
    return "/farewell";
  }
  return "";
}

// Export as a getter function to ensure it's evaluated at runtime
export function getSDKCDNUrl(): string {
  return `${getBasePath()}/relayer-sdk/relayer-sdk-js.umd.cjs`;
}

// For backward compatibility, also export as a constant (evaluated at module load in browser)
export const SDK_CDN_URL = typeof window !== "undefined" ? getSDKCDNUrl() : "/relayer-sdk/relayer-sdk-js.umd.cjs";
