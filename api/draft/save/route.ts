import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "../../../../src/lib/prisma";
import { requireSession } from "../../../../src/lib/requireSession";
import { getClientIp, getDeviceFromUA, getUserAgent } from "../../../../src/lib/request";

const schema = z.object({
  evaluationId: z.string().min(1),
  answersJson: z.record(z.string(), z.string()),
  progress: z.number().min(0).max(100)
});

export async function POST(req: Request) {
  const session = await requireSession().catch(() => null);
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const ip = getClientIp();
  const userAgent = getUserAgent();
  const device = getDeviceFromUA(userAgent);

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });

  const { evaluationId, answersJson, progress } = parsed.data;

  const ev = await prisma.evaluation.findUnique({ where: { id: evaluationId } });
  if (!ev || ev.userId !== session.uid) return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  if (ev.status !== "DRAFT") return NextResponse.json({ error: "Avaliação não está em DRAFT" }, { status: 409 });

  await prisma.$transaction(async (tx) => {
    await tx.evaluationDraft.upsert({
      where: { evaluationId },
      create: { evaluationId, answersJson, progress, lastSavedAt: new Date() },
      update: { answersJson, progress, lastSavedAt: new Date() }
    });

    await tx.auditLog.create({ data: { userId: session.uid, evaluationId, action: "DRAFT_SAVE", ip, userAgent, device } });
  });

  return NextResponse.json({ ok: true });
}
