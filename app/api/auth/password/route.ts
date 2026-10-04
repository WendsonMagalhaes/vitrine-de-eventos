import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { json, route } from "@/lib/server";

// Troca de senha da própria conta (qualquer perfil). Exige a senha atual.
export const POST = route(["CLIENT", "PROVIDER", "ADMIN"], async (req, _c, s) => {
  const b = z.object({ current: z.string().min(1, "informe a senha atual"), next: z.string().min(8, "mínimo de 8 caracteres") }).parse(await req.json());
  const user = await prisma.user.findUnique({ where: { id: s.sub }, select: { passwordHash: true } });
  if (!user || !(await bcrypt.compare(b.current, user.passwordHash))) return json({ error: "Senha atual incorreta" }, 400);
  await prisma.user.update({ where: { id: s.sub }, data: { passwordHash: await bcrypt.hash(b.next, 10) } });
  return json({ ok: true });
});
