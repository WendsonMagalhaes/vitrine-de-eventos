import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { json, route } from "@/lib/server";

const slugify = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export const GET = route(["ADMIN"], async () =>
  json(await prisma.category.findMany({ orderBy: { sortOrder: "asc" }, include: { _count: { select: { providers: true } } } })));

export const POST = route(["ADMIN"], async (req) => {
  const { name } = z.object({ name: z.string().trim().min(2).max(60) }).parse(await req.json());
  const slug = slugify(name);
  if (!slug) return json({ error: "Nome inválido" }, 400);
  if (await prisma.category.findFirst({ where: { OR: [{ slug }, { name }] } })) return json({ error: "Categoria já existe" }, 409);
  const last = await prisma.category.aggregate({ _max: { sortOrder: true } });
  return json(await prisma.category.create({ data: { name, slug, sortOrder: (last._max.sortOrder ?? 0) + 1 } }), 201);
});
