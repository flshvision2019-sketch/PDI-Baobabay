import { cookies } from "next/headers";
import { getCookieName, verifySession } from "./auth";

export async function requireSession() {
  const token = cookies().get(getCookieName())?.value;
  if (!token) throw new Error("UNAUTHORIZED");
  return await verifySession(token);
}
