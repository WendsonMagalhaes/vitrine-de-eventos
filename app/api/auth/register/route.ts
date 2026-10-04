import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { json, route, signToken } from "@/lib/server";

const schema = z.object({
  name: z.string().min(2), email: z.string().email(), password: z.string().min(8),
  role: z.enum(["CLIENT", "PROVIDER"]).default("CLIENT"), // ADMIN nunca é criado por aqui
});
export const POST = route(null, async (req) => {
  const b = schema.parse(await req.json());
  const email = b.email.toLowerCase();
  if (await prisma.user.findUnique({ where: { email } })) return json({ error: "E-mail já cadastrado" }, 409);
  const user = await prisma.user.create({
    data: {
      name: b.name, email, role: b.role, passwordHash: await bcrypt.hash(b.password, 10),
      ...(b.role === "PROVIDER" ? { provider: { create: { name: b.name } } } : {}),
    },
  });
  return json({ token: await signToken({ sub: user.id, role: user.role }), user: { id: user.id, name: user.name, role: user.role } }, 201);
});
