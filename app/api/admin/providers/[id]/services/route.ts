import { prisma } from "@/lib/prisma";
import { json, route } from "@/lib/server";
import { serviceSchema } from "@/lib/adminSchemas";
import { imageAllowed } from "@/lib/cloudinary";

export const POST = route(["ADMIN"], async (req, ctx) => {
  const { id } = await ctx.params;
  const provider = await prisma.provider.findUnique({ where: { id }, select: { id: true, userId: true } });
  if (!provider) return json({ error: "Fornecedor não encontrado" }, 404);
  const data = serviceSchema.parse(await req.json());
  if (!imageAllowed(data, ["vitrine/admin", `vitrine/providers/${provider.userId}`])) return json({ error: "Imagem inválida" }, 400);
  return json(await prisma.service.create({ data: { ...data, imageUrl: data.imageUrl ?? null, imagePublicId: data.imagePublicId ?? null, providerId: id } }), 201);
});
