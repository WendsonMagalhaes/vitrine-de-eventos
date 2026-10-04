import { prisma } from "@/lib/prisma";
import { json, route } from "@/lib/server";

// Quem sou eu? O app chama logo após o login e escolhe a experiência pelo "role":
// CLIENT -> vitrine, busca e favoritos | PROVIDER -> gestão do próprio perfil | ADMIN -> painel web.
export const GET = route(["CLIENT", "PROVIDER", "ADMIN"], async (_r, _c, s) => {
  const user = await prisma.user.findUnique({
    where: { id: s.sub },
    select: { id: true, name: true, email: true, role: true, provider: { select: { id: true, status: true, featured: true } } },
  });
  return user ? json(user) : json({ error: "Usuário não encontrado" }, 404);
});
