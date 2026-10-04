import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { json, route } from "@/lib/server";
import { providerFields } from "@/lib/adminSchemas";

const include = { categories: { include: { category: true } }, services: true, images: true } as const;

export const GET = route(["ADMIN"], async (req) => {
  const status = req.nextUrl.searchParams.get("status") as any;
  return json(await prisma.provider.findMany({
    where: status ? { status } : {}, orderBy: { createdAt: "desc" }, include,
  }));
});

// O administrador cadastra o fornecedor junto com o login dele (e-mail + senha provisória).
export const POST = route(["ADMIN"], async (req) => {
  const { email, password, categoryIds, ...data } = z.object({
    ...providerFields, email: z.string().trim().email("e-mail inválido"), password: z.string().min(8, "mínimo de 8 caracteres"),
  }).parse(await req.json());
  const e = email.toLowerCase();
  if (await prisma.user.findUnique({ where: { email: e } })) return json({ error: "E-mail já cadastrado" }, 409);
  const user = await prisma.user.create({
    data: {
      email: e, name: data.name, role: "PROVIDER", passwordHash: await bcrypt.hash(password, 10),
      provider: { create: { ...data, featured: data.featured && data.status === "APPROVED", categories: { create: categoryIds.map((categoryId) => ({ categoryId })) } } },
    },
    include: { provider: { include } },
  });
  return json(user.provider, 201);
});
