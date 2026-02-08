import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../../../../src/lib/prisma";
import { signSession, getCookieName } from "../../../../src/lib/auth";
import { getClientIp, getDeviceFromUA, getUserAgent } from "../../../../src/lib/request";

const schema = z.object({
  employeeCode: z.string().min(1),
  storeCode: z.string().min(1),
  zone: z.string().min(1),
  password: z.string().min(1)
});

export async function POST(req: Request) {
  const ip = getClientIp();
  const userAgent = getUserAgent();
  const device = getDeviceFromUA(userAgent);

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });

  const { employeeCode, storeCode, zone, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { employeeCode } });
  const ok =
    user &&
    user.isActive &&
    user.storeCode.toUpperCase() == storeCode.toUpperCase().trim() &&
    String(user.zone).toUpperCase() == zone.toUpperCase().trim() &&
    (await bcrypt.compare(password, user.passwordHash));

  await prisma.auditLog.create({
    data: { userId: user?.id, action: ok ? "LOGIN_SUCCESS" : "LOGIN_FAIL", ip, userAgent, device }
  });

  if (!ok) return NextResponse.json({ error: "Credenciais inválidas" }, { status: 401 });

  const token = await signSession({ uid: user.id, role: user.role, employeeCode: user.employeeCode, storeCode: user.storeCode, zone: user.zone });

  const res = NextResponse.json({ ok: true });
  res.cookies.set(getCookieName(), token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 12 });
  return res;
}
