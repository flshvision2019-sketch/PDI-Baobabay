import { SignJWT, jwtVerify } from "jose";

const secret = new TextEncoder().encode(process.env.APP_JWT_SECRET || "dev_secret_change_me");
const cookieName = "pdi_session";

export type SessionPayload = {
  uid: string;
  role: "EMPLOYEE" | "SUPERVISOR" | "HR_ADMIN";
  employeeCode: string;
  storeCode: string;
  zone: string;
};

export function getCookieName() {
  return cookieName;
}

export async function signSession(payload: SessionPayload) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("12h")
    .sign(secret);
}

export async function verifySession(token: string) {
  const { payload } = await jwtVerify(token, secret);
  return payload as unknown as SessionPayload;
}
