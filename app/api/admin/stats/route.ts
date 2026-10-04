import { prisma } from "@/lib/prisma";
import { json, route } from "@/lib/server";

export const GET = route(["ADMIN"], async () => {
  const [byStatus, featured, clients, services, categories] = await Promise.all([
    prisma.provider.groupBy({ by: ["status"], _count: true }),
    prisma.provider.count({ where: { featured: true, status: "APPROVED" } }),
    prisma.user.count({ where: { role: "CLIENT" } }),
    prisma.service.count({ where: { provider: { status: "APPROVED" } } }),
    prisma.category.findMany({ orderBy: { sortOrder: "asc" }, select: { name: true, _count: { select: { providers: { where: { provider: { status: "APPROVED" } } } } } } }),
  ]);
  return json({
    status: Object.fromEntries(byStatus.map((r) => [r.status, r._count])),
    featured, clients, services,
    categories: categories.map((c) => ({ name: c.name, count: c._count.providers })),
  });
});
