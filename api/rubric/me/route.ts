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

  const user = await prisma.user.findUnique({ where: { id: session.uid } });
  if (!user) return NextResponse.json({ error: "Utilizador inválido" }, { status: 401 });

  const rubric = await prisma.rubric.findFirst({
    where: { position: user.position, isActive: true },
    include: { items: { include: { options: true }, orderBy: { order: "asc" } } }
  });
  if (!rubric) return NextResponse.json({ error: "Rubric não encontrado para o cargo" }, { status: 404 });

  const cycle = await getOrCreateCurrentCycle();

  let evaluation = await prisma.evaluation.findFirst({ where: { userId: user.id, cycleId: cycle.id, status: "DRAFT" } });
  if (!evaluation) {
    evaluation = await prisma.evaluation.create({ data: { userId: user.id, rubricId: rubric.id, cycleId: cycle.id, status: "DRAFT" } });
    await prisma.auditLog.create({ data: { userId: user.id, evaluationId: evaluation.id, action: "DRAFT_CREATE", ip, userAgent, device } });
  }

  const items = rubric.items.map((it) => ({
    id: it.id,
    category: it.category,
    question: it.question,
    description: it.description,
    options: it.options.sort((a,b)=>a.order-b.order).map((o)=>({ id: o.id, label: o.label, points: o.points }))
  }));

  return NextResponse.json({ rubricId: rubric.id, evaluationId: evaluation.id, items });
}
