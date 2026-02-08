import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "../../../../src/lib/prisma";
import { requireSession } from "../../../../src/lib/requireSession";
import { getClientIp, getDeviceFromUA, getUserAgent } from "../../../../src/lib/request";

const schema = z.object({
  evaluationId: z.string().min(1),
  rubricId: z.string().min(1),
  answers: z.array(z.object({ itemId: z.string().min(1), optionId: z.string().min(1) })).min(1)
});

function resolveLevel(total: number, bands: { level: string; minScore: number; maxScore: number }[]) {
  const b = bands.find(x => total >= x.minScore && total <= x.maxScore);
  return b?.level ?? "SEM_CLASSIFICACAO";
}

export async function POST(req: Request) {
  const session = await requireSession().catch(() => null);
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const ip = getClientIp();
  const userAgent = getUserAgent();
  const device = getDeviceFromUA(userAgent);

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });

  const { evaluationId, rubricId, answers } = parsed.data;

  const ev = await prisma.evaluation.findUnique({ where: { id: evaluationId } });
  if (!ev || ev.userId !== session.uid) return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  if (ev.status !== "DRAFT") return NextResponse.json({ error: "Avaliação não está em DRAFT" }, { status: 409 });

  const already = await prisma.evaluation.findFirst({ where: { userId: session.uid, cycleId: ev.cycleId, status: "SUBMITTED" } });
  if (already) return NextResponse.json({ error: "Já submeteu neste ciclo." }, { status: 409 });

  const optionIds = answers.map(a => a.optionId);
  const options = await prisma.rubricOption.findMany({ where: { id: { in: optionIds } } });
  const pointsByOption = new Map(options.map(o => [o.id, o.points]));
  const totalScore = answers.reduce((sum, a) => sum + (pointsByOption.get(a.optionId) ?? 0), 0);

  const bands = await prisma.classificationBand.findMany({ where: { rubricId } });
  const level = resolveLevel(totalScore, bands);

  await prisma.$transaction(async (tx) => {
    await tx.evaluationAnswer.deleteMany({ where: { evaluationId } });
    await tx.evaluationAnswer.createMany({
      data: answers.map(a => ({ evaluationId, itemId: a.itemId, optionId: a.optionId, points: pointsByOption.get(a.optionId) ?? 0 }))
    });

    await tx.evaluation.update({
      where: { id: evaluationId },
      data: { rubricId, totalScore, level, status: "SUBMITTED", submittedAt: new Date() }
    });

    await tx.evaluationDraft.deleteMany({ where: { evaluationId } });

    await tx.auditLog.create({ data: { userId: session.uid, evaluationId, action: "SUBMIT", ip, userAgent, device } });
  });

  return NextResponse.json({ ok: true, totalScore, level });
}
