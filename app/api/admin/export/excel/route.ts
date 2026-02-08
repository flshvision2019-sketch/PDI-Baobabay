import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { prisma } from "../../../../../src/lib/prisma";
import { requireSession } from "../../../../../src/lib/requireSession";
import { getOrCreateCurrentCycle } from "../../../../../src/lib/cycle";
import { getClientIp, getDeviceFromUA, getUserAgent } from "../../../../../src/lib/request";

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
  const search = url.searchParams.get("search") ?? "";

  const cycle = cycleKey ? await prisma.cycle.findUnique({ where: { key: cycleKey } }) : await getOrCreateCurrentCycle();
  if (!cycle) return NextResponse.json({ error: "Ciclo inválido" }, { status: 400 });

  const where: any = { cycleId: cycle.id };
  if (status) where.status = status;
  where.user = {};
  if (storeCode) where.user.storeCode = storeCode.toUpperCase();
  if (zone) where.user.zone = zone.toUpperCase();
  if (position) where.user.position = position.toUpperCase();
  if (search) {
    where.user.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { employeeCode: { contains: search, mode: "insensitive" } }
    ];
  }

  const evals = await prisma.evaluation.findMany({ where, include: { user: true }, orderBy: [{ status: "asc" }, { totalScore: "desc" }] });

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Avaliações");
  ws.columns = [
    { header: "Ciclo", key: "cycle", width: 12 },
    { header: "Mecanográfico", key: "employeeCode", width: 16 },
    { header: "Nome", key: "name", width: 28 },
    { header: "Loja", key: "storeCode", width: 10 },
    { header: "Zona", key: "zone", width: 14 },
    { header: "Cargo", key: "position", width: 18 },
    { header: "Score", key: "totalScore", width: 10 },
    { header: "Nível", key: "level", width: 10 },
    { header: "Status", key: "status", width: 12 },
    { header: "Submetido em", key: "submittedAt", width: 22 }
  ];
  evals.forEach(e => ws.addRow({
    cycle: cycle.key,
    employeeCode: e.user.employeeCode,
    name: e.user.name,
    storeCode: e.user.storeCode,
    zone: e.user.zone,
    position: e.user.position,
    totalScore: e.totalScore,
    level: e.level,
    status: e.status,
    submittedAt: e.submittedAt ? new Date(e.submittedAt).toLocaleString("pt-PT") : ""
  }));
  ws.getRow(1).font = { bold: true };

  const buf = await wb.xlsx.writeBuffer();

  await prisma.auditLog.create({ data: { userId: session.uid, action: "EXPORT_EXCEL", ip, userAgent, device } });

  return new NextResponse(Buffer.from(buf), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="PDI_${cycle.key}.xlsx"`
    }
  });
}
