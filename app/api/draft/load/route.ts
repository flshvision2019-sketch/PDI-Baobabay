import { NextResponse } from "next/server";
import { prisma } from "../../../../src/lib/prisma";
import { requireSession } from "../../../../src/lib/requireSession";
import { getOrCreateCurrentCycle } from "../../../../src/lib/cycle";
import { getClientIp, getDeviceFromUA, getUserAgent } from "../../../../src/lib/request";

export async function GET() {
  const session = await requireSession().catch(() => null);
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const ip = getClientIp();
  const userAgent = getUserAgent();
  const device = getDeviceFromUA(userAgent);

  const cycle = await getOrCreateCurrentCycle();
  const ev = await prisma.evaluation.findFirst({ where: { userId: session.uid, cycleId: cycle.id, status: "DRAFT" } });
  if (!ev) return NextResponse.json({ answersJson: null, progress: 0 });

  const draft = await prisma.evaluationDraft.findUnique({ where: { evaluationId: ev.id } });

  await prisma.auditLog.create({ data: { userId: session.uid, evaluationId: ev.id, action: "DRAFT_LOAD", ip, userAgent, device } });

  return NextResponse.json({ answersJson: draft?.answersJson ?? null, progress: draft?.progress ?? 0 });
}
