import { NextResponse } from "next/server";
import { prisma } from "../../../../src/lib/prisma";
import { requireSession } from "../../../../src/lib/requireSession";
import { getOrCreateCurrentCycle } from "../../../../src/lib/cycle";
import { getClientIp, getDeviceFromUA, getUserAgent } from "../../../../src/lib/request";

export async function GET() {
  const session = await requireSession().catch(() => null);
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  if (session.role !== "SUPERVISOR" && session.role !== "HR_ADMIN") return NextResponse.json({ error: "Sem permissão" }, { status: 403 });

  const ip = getClientIp();
  const userAgent = getUserAgent();
  const device = getDeviceFromUA(userAgent);

  const user = await prisma.user.findUnique({ where: { id: session.uid } });
  if (!user) return NextResponse.json({ error: "Utilizador inválido" }, { status: 401 });

  const cycle = await getOrCreateCurrentCycle();

  const where =
    session.role === "HR_ADMIN"
      ? { cycleId: cycle.id, status: "SUBMITTED" }
      : { cycleId: cycle.id, status: "SUBMITTED", user: { storeCode: user.storeCode, zone: user.zone } };

  const evaluations = await prisma.evaluation.findMany({
    where,
    include: { user: true },
    orderBy: [{ totalScore: "desc" }, { submittedAt: "desc" }]
  });

  await prisma.auditLog.create({ data: { userId: session.uid, action: "SUPERVISOR_VIEW", ip, userAgent, device } });

  const rows = evaluations.map(e => ({
    employeeCode: e.user.employeeCode,
    name: e.user.name,
    storeCode: e.user.storeCode,
    zone: e.user.zone,
    position: e.user.position,
    totalScore: e.totalScore,
    level: e.level,
    submittedAt: e.submittedAt?.toISOString() ?? null
  }));

  return NextResponse.json({ rows, cycleKey: cycle.key });
}
