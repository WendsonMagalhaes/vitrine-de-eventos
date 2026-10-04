import { prisma } from "@/lib/prisma";
import { json, route } from "@/lib/server";

// Números do painel do fornecedor: quantos clientes favoritaram o perfil.
export const GET = route(["PROVIDER"], async (_r, _c, s) =>
  json({ favorites: await prisma.favorite.count({ where: { provider: { userId: s.sub } } }) }));
