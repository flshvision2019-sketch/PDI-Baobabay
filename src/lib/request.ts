import { headers } from "next/headers";

export function getClientIp() {
  const h = headers();
  const xf = h.get("x-forwarded-for");
  if (xf) return xf.split(",")[0].trim();
  return h.get("x-real-ip") ?? undefined;
}

export function getUserAgent() {
  return headers().get("user-agent") ?? undefined;
}

export function getDeviceFromUA(ua?: string) {
  if (!ua) return undefined;
  const s = ua.toLowerCase();
  if (s.includes("mobile") || s.includes("android") || s.includes("iphone")) return "mobile";
  return "desktop";
}
