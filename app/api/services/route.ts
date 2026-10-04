import { prisma } from "@/lib/prisma";
import { json, route } from "@/lib/server";
import { serviceSchema } from "@/lib/adminSchemas";
import { imageAllowed } from "@/lib/cloudinary";

export const POST = route(["PROVIDER"], async (req, _c, s) => {
  const provider = await prisma.provider.findUnique({ where: { userId: s.sub } });
  if (!provider) return json({ error: "Perfil não encontrado" }, 404);
  const data = serviceSchema.parse(await req.json());
  if (!imageAllowed(data, [`vitrine/providers/${s.sub}`])) return json({ error: "Imagem inválida" }, 400);
  return json(await prisma.service.create({ data: { ...data, imageUrl: data.imageUrl ?? null, imagePublicId: data.imagePublicId ?? null, providerId: provider.id } }), 201);
});
