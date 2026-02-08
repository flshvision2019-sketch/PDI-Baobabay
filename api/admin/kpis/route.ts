import { NextResponse } from "next/server";
import { prisma } from "../../../../../src/lib/prisma";
import { requireSession } from "../../../../../src/lib/requireSession";
import { getOrCreateCurrentCycle } from "../../../../../src/lib/cycle";
import { getClientIp, getDeviceFromUA, getUserAgent } from "../../../../../src/lib/request";

export async function GET() {
  const session = await requireSession().catch(() => null);
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  if (session.role !== "HR_ADMIN") return NextResponse.json({ error: "Sem permissão" }, { status: 403 });

  const ip = getClientIp();
  const userAgent = getUserAgent();
  const device = getDeviceFromUA(userAgent);

  const cycle = await getOrCreateCurrentCycle();

  const totalUsers = await prisma.user.count({ where: { isActive: true } });
  const submitted = await prisma.evaluation.count({ where: { cycleId: cycle.id, status: "SUBMITTED" } });
  const drafts = await prisma.evaluation.count({ where: { cycleId: cycle.id, status: "DRAFT" } });

  const avg = await prisma.evaluation.aggregate({
    where: { cycleId: cycle.id, status: "SUBMITTED" },
    _avg: { totalScore: true }
  });

  const byLevel = await prisma.evaluation.groupBy({
    by: ["level"],
    where: { cycleId: cycle.id, status: "SUBMITTED" },
    _count: { _all: true }
  });

  const byZone = await prisma.evaluation.groupBy({
    by: ["level"],
    where: { cycleId: cycle.id, status: "SUBMITTED" },
    _count: { _all: true }
  });

  // Distribuição por zona (via relação user)
  const zoneAgg = await prisma.user.groupBy({
    by: ["zone"],
    where: { evaluations: { some: { cycleId: cycle.id, status: "SUBMITTED" } } },
    _count: { _all: true }
  });

  await prisma.auditLog.create({ data: { userId: session.uid, action: "ADMIN_KPIS_VIEW", ip, userAgent, device } });

  return NextResponse.json({
    cycleKey: cycle.key,
    totals: {
      totalUsers,
      submitted,
      drafts,
      pending: Math.max(totalUsers - submitted, 0),
      avgScore: Math.round((avg._avg.totalScore ?? 0) * 10) / 10
    },
    byLevel: byLevel.map(x => ({ label: x.level || "SEM", value: x._count._all })),
    byZone: zoneAgg.map(x => ({ label: String(x.zone), value: x._count._all }))
  });
}
