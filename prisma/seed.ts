import { PrismaClient, Role, Zone } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const now = new Date();
  const yyyy = now.getUTCFullYear();
  const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
  const key = `${yyyy}-${mm}`;

  const startAt = new Date(Date.UTC(yyyy, now.getUTCMonth(), 1, 0, 0, 0));
  const endAt = new Date(Date.UTC(yyyy, now.getUTCMonth() + 1, 0, 23, 59, 59));

  await prisma.cycle.upsert({
    where: { key },
    create: { key, name: `Ciclo ${key}`, startAt, endAt, isActive: true },
    update: { isActive: true }
  });

  await prisma.rubric.upsert({
    where: { id: "rubric_promotor_v1" },
    create: {
      id: "rubric_promotor_v1",
      position: "PROMOTOR",
      title: "PDI PROMOTOR",
      version: 1,
      isActive: true,
      bands: {
        create: [
          { level: "OJT", minScore: 0, maxScore: 65 },
          { level: "JUNIOR", minScore: 65.1, maxScore: 83 },
          { level: "PLENO", minScore: 85, maxScore: 95 },
          { level: "SENIOR", minScore: 95, maxScore: 100 }
        ]
      },
      items: {
        create: [
          {
            category: "Cultura e Valores",
            question: "Assiduidade e pontualidade",
            maxPoints: 5,
            order: 1,
            options: {
              create: [
                { label: "Nunca", points: 0, order: 1 },
                { label: "Às vezes", points: 2, order: 2 },
                { label: "Quase sempre", points: 4, order: 3 },
                { label: "Sempre", points: 5, order: 4 }
              ]
            }
          },
          {
            category: "Vendas",
            question: "Apresenta o produto com clareza",
            maxPoints: 5,
            order: 2,
            options: {
              create: [
                { label: "Fraco", points: 1, order: 1 },
                { label: "Regular", points: 2, order: 2 },
                { label: "Bom", points: 4, order: 3 },
                { label: "Excelente", points: 5, order: 4 }
              ]
            }
          }
        ]
      }
    },
    update: {}
  });

  const pw = await bcrypt.hash("123456", 10);

  await prisma.user.upsert({
    where: { employeeCode: "10001" },
    create: { employeeCode: "10001", name: "Colaborador Demo", storeCode: "Y17", zone: Zone.KILAMBA, position: "PROMOTOR", role: Role.EMPLOYEE, passwordHash: pw },
    update: {}
  });

  await prisma.user.upsert({
    where: { employeeCode: "90001" },
    create: { employeeCode: "90001", name: "Supervisor Demo", storeCode: "Y17", zone: Zone.KILAMBA, position: "SUPERVISOR", role: Role.SUPERVISOR, passwordHash: pw },
    update: {}
  });

  await prisma.user.upsert({
    where: { employeeCode: "99001" },
    create: { employeeCode: "99001", name: "RH Admin Demo", storeCode: "HQ", zone: Zone.CIDADE, position: "RH", role: Role.HR_ADMIN, passwordHash: pw },
    update: {}
  });

  console.log("Seed concluído. Logins demo: 10001 / 90001 / 99001 senha 123456");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
