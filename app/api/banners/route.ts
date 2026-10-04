import { prisma } from "@/lib/prisma";
import { json, route } from "@/lib/server";

// Público: só banners ativos. O vínculo com fornecedor só vale se ele estiver publicado.
export const GET = route(null, async () => {
  const rows = await prisma.banner.findMany({
    where: { active: true }, orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    select: { id: true, title: true, subtitle: true, imageUrl: true, color: true, providerId: true, provider: { select: { status: true } } },
  });
  return json(rows.map(({ provider, providerId, ...b }) => ({ ...b, providerId: provider?.status === "APPROVED" ? providerId : null })));
});
