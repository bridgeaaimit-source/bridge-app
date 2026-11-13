"use client";

// Tags every request the app makes to its own /api routes with the signed-in
// student's uid (header: x-bridge-uid). The server-side usage tracker
// (lib/tokenTrackerServer.js) uses it when a route did not pass a uid in the
// body, so the admin usage dashboard can show cost per student by name.
//
// The patch runs when this module loads, before any page code calls fetch.
// It only touches same-origin /api/ URLs and never changes the request
// otherwise. Firebase is loaded lazily so pages that never call /api pay
// nothing extra.

let firebaseModule = null;

function getUid() {
  if (!firebaseModule) {
    firebaseModule = import("@/lib/firebase").catch(() => null);
  }
  return firebaseModule.then((m) => m?.auth?.currentUser?.uid || null);
}

function isOwnApi(url) {
  if (typeof url !== "string") return false;
  if (url.startsWith("/api/")) return true;
  try {
    const u = new URL(url, window.location.href);
    return u.origin === window.location.origin && u.pathname.startsWith("/api/");
  } catch {
    return false;
  }
}

if (typeof window !== "undefined" && !window.__bridgeFetchTagged) {
  window.__bridgeFetchTagged = true;
  const originalFetch = window.fetch.bind(window);

  window.fetch = async function bridgeFetch(input, init) {
    let url = null;
    if (typeof input === "string") url = input;
    else if (input instanceof URL) url = input.href;

    if (!url || !isOwnApi(url)) return originalFetch(input, init);

    try {
      const uid = await getUid();
      if (uid) {
        const headers = new Headers(init?.headers || undefined);
        if (!headers.has("x-bridge-uid")) headers.set("x-bridge-uid", uid);
        return originalFetch(input, { ...(init || {}), headers });
      }
    } catch {
      // Fall through to the untouched request.
    }
    return originalFetch(input, init);
  };
}

export default function ApiIdentity() {
  return null;
}
