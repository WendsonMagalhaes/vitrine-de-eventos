import bcrypt from "bcryptjs"; // se o seu login usa outra lib (bcrypt, argon2...), troque este import e a linha do compare
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { json, route } from "@/lib/server";

// Troca o e-mail de acesso. Pede a senha atual para confirmar que é a própria pessoa.
export const PATCH = route(["CLIENT", "PROVIDER"], async (req, _c, s) => {
  const { email, password } = z.object({
    email: z.string().trim().toLowerCase().email("e-mail inválido").max(160),
    password: z.string().min(1, "informe a senha atual"),
  }).parse(await req.json());

  const user = await prisma.user.findUnique({ where: { id: s.sub }, select: { id: true, email: true, passwordHash: true } });
  if (!user) return json({ error: "Conta não encontrada" }, 404);
  if (!(await bcrypt.compare(password, user.passwordHash))) return json({ error: "Senha atual incorreta" }, 403);
  if (email === user.email.toLowerCase()) return json({ email: user.email });

  const taken = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (taken) return json({ error: "Este e-mail já está em uso" }, 409);

  const updated = await prisma.user.update({ where: { id: user.id }, data: { email }, select: { email: true } });
  return json({ email: updated.email });
});
