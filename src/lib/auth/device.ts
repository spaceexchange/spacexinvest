// Lightweight client-side device fingerprint (non-cryptographic; identifies devices for the security center)
export function getDeviceFingerprint(): string {
  if (typeof window === "undefined") return "ssr";
  try {
    const stored = localStorage.getItem("spx_device_fp");
    if (stored) return stored;
    const fp = `${navigator.userAgent}|${screen.width}x${screen.height}|${Intl.DateTimeFormat().resolvedOptions().timeZone}|${Math.random().toString(36).slice(2, 10)}`;
    const hashNum = fp.split("").reduce<number>((h, c) => ((h << 5) - h + c.charCodeAt(0)) | 0, 0);
    const out = `dev_${Math.abs(hashNum).toString(36)}_${Date.now().toString(36)}`;
    localStorage.setItem("spx_device_fp", out);
    return out;
  } catch {
    return "anonymous";
  }
}

export function getDeviceMeta() {
  if (typeof window === "undefined") return { browser: "", os: "", deviceName: "Server" };
  const ua = navigator.userAgent;
  const browser = /Edg\//.test(ua) ? "Edge" : /Chrome\//.test(ua) ? "Chrome" : /Safari\//.test(ua) ? "Safari" : /Firefox\//.test(ua) ? "Firefox" : "Browser";
  const os = /Windows/.test(ua) ? "Windows" : /Mac OS X/.test(ua) ? "macOS" : /Android/.test(ua) ? "Android" : /iPhone|iPad/.test(ua) ? "iOS" : /Linux/.test(ua) ? "Linux" : "Unknown";
  return { browser, os, deviceName: `${browser} on ${os}` };
}

export async function recordSecurityEvent(
  userId: string,
  eventType: string,
  metadata: Record<string, unknown> = {},
) {
  const { supabase } = await import("@/integrations/supabase/client");
  await supabase.from("security_events").insert({
    user_id: userId,
    // @ts-expect-error - enum cast at insert
    event_type: eventType,
    device_fingerprint: getDeviceFingerprint(),
    user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
    metadata: metadata as never,
  });
}

export async function trackDevice(userId: string) {
  const { supabase } = await import("@/integrations/supabase/client");
  const fp = getDeviceFingerprint();
  const meta = getDeviceMeta();
  await supabase.from("user_devices").upsert(
    {
      user_id: userId,
      device_fingerprint: fp,
      device_name: meta.deviceName,
      browser: meta.browser,
      os: meta.os,
      last_seen_at: new Date().toISOString(),
    },
    { onConflict: "user_id,device_fingerprint" },
  );
}
