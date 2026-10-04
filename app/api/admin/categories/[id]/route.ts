import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { json, route } from "@/lib/server";

// O slug não muda ao renomear: o app usa o slug para escolher o ícone da categoria.
export const PUT = route(["ADMIN"], async (req, ctx) => {
  const { id } = await ctx.params;
  const { name } = z.object({ name: z.string().trim().min(2).max(60) }).parse(await req.json());
  if (await prisma.category.findFirst({ where: { name, NOT: { id } } })) return json({ error: "Já existe uma categoria com esse nome" }, 409);
  return json(await prisma.category.update({ where: { id }, data: { name } }));
});
export const DELETE = route(["ADMIN"], async (_r, ctx) => {
  const { id } = await ctx.params;
  if ((await prisma.providerCategory.count({ where: { categoryId: id } })) > 0) return json({ error: "Há fornecedores nesta categoria. Mova-os antes de excluir." }, 409);
  await prisma.category.delete({ where: { id } });
  return json({ ok: true });
});
