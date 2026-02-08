import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "../../../../src/lib/prisma";
import { requireSession } from "../../../../src/lib/requireSession";
import { getOrCreateCurrentCycle } from "../../../../src/lib/cycle";
import { getClientIp, getDeviceFromUA, getUserAgent } from "../../../../src/lib/request";

const schema = z.object({ employeeCode: z.string().min(1), cycleKey: z.string().optional() });

export async function POST(req: Request) {
  const session = await requireSession().catch(() => null);
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  if (session.role !== "HR_ADMIN") return NextResponse.json({ error: "Sem permissão" }, { status: 403 });

  const ip = getClientIp();
  const userAgent = getUserAgent();
  const device = getDeviceFromUA(userAgent);

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });

  const { employeeCode, cycleKey } = parsed.data;

  const user = await prisma.user.findUnique({ where: { employeeCode } });
  if (!user) return NextResponse.json({ error: "Colaborador não encontrado" }, { status: 404 });

  const cycle = cycleKey ? await prisma.cycle.findUnique({ where: { key: cycleKey } }) : await getOrCreateCurrentCycle();
  if (!cycle) return NextResponse.json({ error: "Ciclo inválido" }, { status: 400 });

  await prisma.$transaction(async (tx) => {
    const existing = await tx.evaluation.findFirst({ where: { userId: user.id, cycleId: cycle.id } });
    if (existing) {
      await tx.auditLog.create({ data: { userId: session.uid, evaluationId: existing.id, action: "ADMIN_RETAKE_DELETE_PREVIOUS", ip, userAgent, device } });
      await tx.evaluation.delete({ where: { id: existing.id } });
    } else {
      await tx.auditLog.create({ data: { userId: session.uid, action: "ADMIN_RETAKE_NO_PREVIOUS", ip, userAgent, device } });
    }

    const rubric = await tx.rubric.findFirst({ where: { position: user.position, isActive: true } });
    if (!rubric) throw new Error("Rubric não encontrado para o cargo");

    const ev = await tx.evaluation.create({ data: { userId: user.id, rubricId: rubric.id, cycleId: cycle.id, status: "DRAFT" } });
    await tx.auditLog.create({ data: { userId: session.uid, evaluationId: ev.id, action: "ADMIN_RETAKE_CREATE_DRAFT", ip, userAgent, device } });
  });

  return NextResponse.json({ ok: true });
}
