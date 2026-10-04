import { prisma } from "@/lib/prisma";
import { json, route } from "@/lib/server";

export const GET = route(null, async (_req, ctx) => {
  const { id } = await ctx.params;
  const p = await prisma.provider.findFirst({
    where: { id, status: "APPROVED" },
    select: { id: true, name: true, description: true, city: true, phone: true, whatsapp: true, featured: true,
      categories: { select: { category: { select: { name: true, slug: true } } } },
      services: { orderBy: { createdAt: "asc" } },
      images: { orderBy: { sortOrder: "asc" }, select: { id: true, url: true } } },
  });
  return p ? json(p) : json({ error: "Fornecedor não encontrado" }, 404);
});
