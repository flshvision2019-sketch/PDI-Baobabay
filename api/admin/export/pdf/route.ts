import { NextResponse } from "next/server";
import PDFDocument from "pdfkit";
import { prisma } from "../../../../../src/lib/prisma";
import { requireSession } from "../../../../../src/lib/requireSession";
import { getOrCreateCurrentCycle } from "../../../../../src/lib/cycle";
import { getClientIp, getDeviceFromUA, getUserAgent } from "../../../../../src/lib/request";

function docToBuffer(doc: PDFDocument) {
  return new Promise<Buffer>((resolve) => {
    const chunks: Buffer[] = [];
    doc.on("data", (c) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.end();
  });
}

export async function GET(req: Request) {
  const session = await requireSession().catch(() => null);
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  if (session.role !== "HR_ADMIN") return NextResponse.json({ error: "Sem permissão" }, { status: 403 });

  const ip = getClientIp();
  const userAgent = getUserAgent();
  const device = getDeviceFromUA(userAgent);

  const url = new URL(req.url);
  const cycleKey = url.searchParams.get("cycleKey") ?? "";
  const storeCode = url.searchParams.get("storeCode") ?? "";
  const zone = url.searchParams.get("zone") ?? "";
  const position = url.searchParams.get("position") ?? "";
  const status = url.searchParams.get("status") ?? "";

  const cycle = cycleKey ? await prisma.cycle.findUnique({ where: { key: cycleKey } }) : await getOrCreateCurrentCycle();
  if (!cycle) return NextResponse.json({ error: "Ciclo inválido" }, { status: 400 });

  const where: any = { cycleId: cycle.id };
  if (status) where.status = status;
  where.user = {};
  if (storeCode) where.user.storeCode = storeCode.toUpperCase();
  if (zone) where.user.zone = zone.toUpperCase();
  if (position) where.user.position = position.toUpperCase();

  const evals = await prisma.evaluation.findMany({ where, include: { user: true }, orderBy: [{ totalScore: "desc" }, { submittedAt: "desc" }] });

  const doc = new PDFDocument({ size: "A4", margin: 40 });
  doc.fontSize(18).text("PDI Baobabay - Relatório", { align: "left" });
  doc.moveDown(0.5);
  doc.fontSize(12).text(`Ciclo: ${cycle.key}`);
  if (storeCode) doc.text(`Loja: ${storeCode.toUpperCase()}`);
  if (zone) doc.text(`Zona: ${zone.toUpperCase()}`);
  if (position) doc.text(`Cargo: ${position.toUpperCase()}`);
  if (status) doc.text(`Status: ${status.toUpperCase()}`);
  doc.moveDown();

  doc.fontSize(10);
  doc.text("Mec. | Nome | Loja | Zona | Cargo | Score | Nível");
  doc.moveDown(0.3);
  doc.text("-".repeat(110));
  doc.moveDown(0.3);

  evals.slice(0, 200).forEach(e => {
    const line = [
      e.user.employeeCode,
      (e.user.name || "").slice(0, 24),
      e.user.storeCode,
      e.user.zone,
      (e.user.position || "").slice(0, 10),
      String(e.totalScore),
      e.level
    ].join(" | ");
    doc.text(line);
  });

  if (evals.length > 200) {
    doc.moveDown();
    doc.text(`(Mostrando 200 de ${evals.length} registros — use Excel para lista completa.)`);
  }

  const buf = await docToBuffer(doc);

  await prisma.auditLog.create({ data: { userId: session.uid, action: "EXPORT_PDF", ip, userAgent, device } });

  return new NextResponse(buf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="PDI_${cycle.key}.pdf"`
    }
  });
}
