import ExcelJS from "exceljs";
import { PrismaClient, Zone, Role } from "@prisma/client";

const prisma = new PrismaClient();

function normalize(text: any) {
  return String(text ?? "").replace(/\s+/g, " ").trim();
}

function extractPoints(standard: string, maxPoints: number) {
  // captura números seguidos de "分" ou "pontos"
  const pts = new Set<number>();
  const re = /(\d+)\s*(?:分|pontos?)/gi;
  let m;
  while ((m = re.exec(standard)) !== null) {
    const n = parseInt(m[1], 10);
    if (!Number.isNaN(n)) pts.add(n);
  }
  // sempre incluir 0 e maxPoints
  pts.add(0);
  pts.add(maxPoints);

  const arr = [...pts].filter((n) => n >= 0 && n <= maxPoints).sort((a, b) => a - b);
  // fallback: 0..max se nada útil
  if (arr.length <= 2) {
    return [0, Math.floor(maxPoints / 2), maxPoints].filter((v, i, a) => a.indexOf(v) === i);
  }
  return arr;
}

async function upsertRubric(position: string, title: string) {
  const id = `rubric_${position}_v1`;
  return prisma.rubric.upsert({
    where: { id },
    create: { id, position, title, version: 1, isActive: true },
    update: { isActive: true }
  });
}

async function importBandsFromResumo(pdiFile: string) {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(pdiFile);
  const ws = wb.getWorksheet("总结");
  if (!ws) throw new Error("Sheet 总结 não encontrado no PDI-Baobabay0315-初.xlsx");

  // limpar bandas existentes (evita duplicar)
  const existing = await prisma.classificationBand.findMany();
  if (existing.length) {
    await prisma.classificationBand.deleteMany();
  }

  let currentRole = "";
  ws.eachRow((row) => {
    const role = normalize(row.getCell(1).value);
    const level = normalize(row.getCell(2).value);
    const rangeTxt = normalize(row.getCell(4).value);

    if (role) currentRole = role;
    if (!currentRole || !level || !rangeTxt) return;
    if (level.includes("合计") || level.toLowerCase().includes("total")) return;

    const m = rangeTxt.match(/([\d.]+)\s*-\s*([\d.]+)/);
    if (!m) return;

    const map: Record<string, string> = { "促销员": "PROMOTOR", "店长": "GERENTE_LOJA", "主管": "SUPERVISOR", "SEDE": "SEDE" };
    const position = map[currentRole] ?? currentRole;

    // cria rubric (se ainda não existir)
    return upsertRubric(position, `PDI ${position}`).then((rubric) =>
      prisma.classificationBand.create({
        data: { rubricId: rubric.id, level: level, minScore: parseFloat(m[1]), maxScore: parseFloat(m[2]) }
      })
    );
  });
}

async function importRubricFromScoreSheet(wb: ExcelJS.Workbook, sheetName: string) {
  const ws = wb.getWorksheet(sheetName);
  if (!ws) return;

  // posição vem no topo (linha 2, col 2 geralmente)
  const pos = normalize(ws.getRow(2).getCell(2).value) || "PROMOTOR";
  const position = pos.toUpperCase();

  const rubric = await upsertRubric(position, `PDI ${position}`);

  // limpar itens/opções anteriores do rubric
  await prisma.rubricOption.deleteMany({ where: { item: { rubricId: rubric.id } } });
  await prisma.rubricItem.deleteMany({ where: { rubricId: rubric.id } });

  // achar linha do header "Itens de Avaliação"
  let headerRow = 1;
  ws.eachRow((row, rowNumber) => {
    const c1 = normalize(row.getCell(1).value);
    if (c1.includes("Itens de Avaliação") || c1.includes("评定项目")) headerRow = rowNumber;
  });

  // começa depois do header
  let category = "";
  let order = 1;

  for (let r = headerRow + 1; r <= ws.rowCount; r++) {
    const row = ws.getRow(r);

    const c1 = normalize(row.getCell(1).value);
    const question = normalize(row.getCell(2).value);
    const standard = normalize(row.getCell(3).value);

    const maxCell = row.getCell(4);
    const maxVal = maxCell.value ?? (maxCell.isMerged ? maxCell.master.value : null);
    const maxPoints = Number(maxVal ?? 0);

    // fim
    if (c1.includes("总分") || question.includes("Pontuação Total")) break;

    if (c1) category = c1;
    if (!question) continue;
    if (!maxPoints || maxPoints <= 0) continue;

    const item = await prisma.rubricItem.create({
      data: {
        rubricId: rubric.id,
        category: category || "Geral",
        question: question,
        description: standard || null,
        maxPoints: Math.round(maxPoints),
        order: order++
      }
    });

    const points = extractPoints(standard, item.maxPoints);
    let o = 1;
    for (const p of points) {
      await prisma.rubricOption.create({
        data: { itemId: item.id, label: `${p} pontos`, points: p, order: o++ }
      });
    }
  }
}

async function importAll(scoreFile: string, bandsFile: string) {
  await importBandsFromResumo(bandsFile);

  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(scoreFile);

  // sheets alvo
  const sheets = wb.worksheets.map(w => w.name).filter(n => n.includes("评分表"));
  for (const s of sheets) {
    await importRubricFromScoreSheet(wb, s);
  }

  console.log("Import concluído (bandas + rubricas).");
}

async function main() {
  const bandsFile = process.env.PDI_BANDS_FILE || "./PDI-Baobabay0315-初.xlsx";
  const scoreFile = process.env.PDI_SCORE_FILE || "./员工定级评分标准-BBB.xlsx";

  await importAll(scoreFile, bandsFile);

  // opcional: criar utilizador RH admin se não existir
  // (para ambientes limpos)
  const existing = await prisma.user.findFirst({ where: { role: Role.HR_ADMIN } });
  if (!existing) {
    console.log("Dica: rode também npm run db:seed para criar logins de teste.");
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
