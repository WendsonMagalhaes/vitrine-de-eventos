import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { json, route } from "@/lib/server";

// O administrador modera a vitrine; nenhuma rota expõe conversas entre cliente e fornecedor.
export const PATCH = route(["ADMIN"], async (req, ctx) => {
  const { id } = await ctx.params;
  const b = z.object({ status: z.enum(["APPROVED", "REJECTED", "SUSPENDED"]), featured: z.boolean().optional() }).parse(await req.json());
  if (!(await prisma.provider.findUnique({ where: { id }, select: { id: true } }))) return json({ error: "Fornecedor não encontrado" }, 404);
  // Só fornecedor publicado pode ser destaque: ao reprovar ou suspender, o destaque sai.
  return json(await prisma.provider.update({ where: { id }, data: { status: b.status, featured: b.status === "APPROVED" ? b.featured : false } }));
});
