import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { json, route, signToken } from "@/lib/server";

export const POST = route(null, async (req) => {
  const b = z.object({ email: z.string().email(), password: z.string() }).parse(await req.json());
  const user = await prisma.user.findUnique({ where: { email: b.email.toLowerCase() } });
  if (!user || !(await bcrypt.compare(b.password, user.passwordHash))) return json({ error: "E-mail ou senha inválidos" }, 401);
  return json({ token: await signToken({ sub: user.id, role: user.role }), user: { id: user.id, name: user.name, role: user.role } });
});
