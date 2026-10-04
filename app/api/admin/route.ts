import { prisma } from "@/lib/prisma";
import { json, route } from "@/lib/server";

// Nunca expõe o hash de senha.
export const GET = route(["ADMIN"], async () =>
  json(await prisma.user.findMany({ orderBy: { createdAt: "desc" }, take: 500, select: { id: true, name: true, email: true, role: true, createdAt: true } })));
