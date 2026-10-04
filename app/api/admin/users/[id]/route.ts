import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { json, route } from "@/lib/server";

const select = { id: true, name: true, email: true, role: true, createdAt: true } as const;

export const PUT = route(["ADMIN"], async (req, ctx, s) => {
  const { id } = await ctx.params;
  const b = z.object({
    name: z.string().trim().min(2, "mínimo de 2 letras").max(120), email: z.string().trim().email("e-mail inválido"),
    role: z.enum(["CLIENT", "PROVIDER", "ADMIN"]),
    password: z.string().min(8, "mínimo de 8 caracteres").optional(), // vazio = mantém a senha atual
  }).parse(await req.json());
  const user = await prisma.user.findUnique({ where: { id }, include: { provider: { select: { id: true } } } });
  if (!user) return json({ error: "Usuário não encontrado" }, 404);
  if (id === s.sub && b.role !== "ADMIN") return json({ error: "Você não pode remover o seu próprio acesso de administrador" }, 400);
  if (user.provider && b.role !== "PROVIDER") return json({ error: "Este usuário tem perfil de fornecedor. Exclua o fornecedor antes de mudar o tipo." }, 409);
  const email = b.email.toLowerCase();
  if (await prisma.user.findFirst({ where: { email, NOT: { id } } })) return json({ error: "E-mail já cadastrado" }, 409);
  const updated = await prisma.user.update({
    where: { id },
    data: {
      name: b.name, email, role: b.role,
      ...(b.password ? { passwordHash: await bcrypt.hash(b.password, 10) } : {}),
      ...(b.role === "PROVIDER" && !user.provider ? { provider: { create: { name: b.name } } } : {}),
    },
    select,
  });
  return json(updated);
});

export const DELETE = route(["ADMIN"], async (_req, ctx, s) => {
  const { id } = await ctx.params;
  if (id === s.sub) return json({ error: "Você não pode excluir a sua própria conta" }, 400);
  const user = await prisma.user.findUnique({ where: { id }, select: { role: true } });
  if (!user) return json({ error: "Usuário não encontrado" }, 404);
  if (user.role === "ADMIN" && (await prisma.user.count({ where: { role: "ADMIN" } })) <= 1) return json({ error: "Não é possível excluir o último administrador" }, 409);
  await prisma.user.delete({ where: { id } });
  return json({ ok: true });
});
