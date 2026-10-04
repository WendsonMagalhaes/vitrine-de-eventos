import { prisma } from "@/lib/prisma";
import { json, route } from "@/lib/server";
export const GET = route(null, async () =>
  json(await prisma.category.findMany({ orderBy: { sortOrder: "asc" } })));
