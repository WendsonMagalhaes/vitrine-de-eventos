import { prisma } from "@/lib/prisma";
import { json, route } from "@/lib/server";
import { missingFields } from "@/lib/providerProfile";

// Rascunho ou reprovado -> Em análise. É isso que faz o fornecedor aparecer para o administrador aprovar.
export const POST = route(["PROVIDER"], async (_r, _c, s) => {
  const p = await prisma.provider.findUnique({ where: { userId: s.sub }, include: { categories: true, images: true } });
  if (!p) return json({ error: "Perfil não encontrado" }, 404);
  if (p.status !== "DRAFT" && p.status !== "REJECTED") return json({ error: "Este perfil já foi enviado ou está publicado" }, 409);
  const missing = missingFields(p);
  if (missing.length) return json({ error: `Falta completar: ${missing.join(", ")}` }, 422);
  return json(await prisma.provider.update({ where: { id: p.id }, data: { status: "PENDING" } }));
});
