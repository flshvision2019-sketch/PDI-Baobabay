import { DateTime } from "luxon";
import { prisma } from "./prisma";

export async function getOrCreateCurrentCycle() {
  const tz = process.env.APP_TIMEZONE || "Africa/Luanda";
  const now = DateTime.now().setZone(tz);
  const key = now.toFormat("yyyy-LL");
  let cycle = await prisma.cycle.findUnique({ where: { key } });
  if (cycle) return cycle;

  const startAt = now.startOf("month").toUTC().toJSDate();
  const endAt = now.endOf("month").toUTC().toJSDate();

  cycle = await prisma.cycle.create({
    data: { key, name: `Ciclo ${key}`, startAt, endAt, isActive: true }
  });
  return cycle;
}
