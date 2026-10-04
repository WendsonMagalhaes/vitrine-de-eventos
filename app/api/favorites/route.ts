import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { json, route } from "@/lib/server";

// Favoritar é coisa de cliente: fornecedor e admin não usam.
const ANY = ["CLIENT"] as const;
export const GET = route([...ANY], async (_r, _c, s) => {
  const favs = await prisma.favorite.findMany({
    where: { userId: s.sub, provider: { status: "APPROVED" } }, orderBy: { createdAt: "desc" },
    select: { provider: { select: { id: true, name: true, city: true, featured: true,
      categories: { select: { category: { select: { name: true, slug: true } } } },
      images: { take: 1, select: { url: true } } } } },
  });
  return json(favs.map((f) => f.provider));
});
export const POST = route([...ANY], async (req, _c, s) => {
  const { providerId } = z.object({ providerId: z.string() }).parse(await req.json());
  if (!(await prisma.provider.findFirst({ where: { id: providerId, status: "APPROVED" } }))) return json({ error: "Fornecedor não encontrado" }, 404);
  await prisma.favorite.upsert({ where: { userId_providerId: { userId: s.sub, providerId } }, update: {}, create: { userId: s.sub, providerId } });
  return json({ ok: true }, 201);
});
export const DELETE = route([...ANY], async (req, _c, s) => {
  await prisma.favorite.deleteMany({ where: { userId: s.sub, providerId: req.nextUrl.searchParams.get("providerId") ?? "" } });
  return json({ ok: true });
});
