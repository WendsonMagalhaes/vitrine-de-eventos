import { prisma } from "@/lib/prisma";
import { json, route } from "@/lib/server";

// Lista pública: apenas fornecedores APROVADOS, destacados primeiro.
export const GET = route(null, async (req) => {
  const p = req.nextUrl.searchParams;
  const q = p.get("q")?.trim(), category = p.get("category"), city = p.get("city");
  const data = await prisma.provider.findMany({
    where: {
      status: "APPROVED",
      ...(q ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { services: { some: { name: { contains: q, mode: "insensitive" } } } }] } : {}),
      ...(category ? { categories: { some: { category: { slug: category } } } } : {}),
      ...(city ? { city: { equals: city, mode: "insensitive" } } : {}),
    },
    orderBy: [{ featured: "desc" }, { name: "asc" }],
    take: Math.min(Number(p.get("limit") ?? 20), 50),
    skip: Number(p.get("offset") ?? 0),
    select: { id: true, name: true, city: true, featured: true,
      categories: { select: { category: { select: { name: true, slug: true } } } },
      images: { orderBy: { sortOrder: "asc" }, take: 1, select: { url: true } } },
  });
  return json(data);
});
