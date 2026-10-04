import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { json, route } from "@/lib/server";

const token = z.string().min(10).max(200).regex(/^Expo(nent)?PushToken\[.+\]$/, "token inválido");

// O app registra o token do aparelho para receber notificações de novas mensagens.
export const POST = route(["CLIENT", "PROVIDER"], async (req, _c, s) => {
  const b = z.object({ token, platform: z.string().max(20).optional() }).parse(await req.json());
  // O mesmo aparelho pode trocar de conta: o token passa a pertencer a quem entrou por último.
  await prisma.pushToken.upsert({ where: { token: b.token }, update: { userId: s.sub, platform: b.platform ?? "unknown" }, create: { token: b.token, userId: s.sub, platform: b.platform ?? "unknown" } });
  return json({ ok: true });
});

export const DELETE = route(["CLIENT", "PROVIDER"], async (req, _c, s) => {
  const b = z.object({ token }).parse(await req.json());
  await prisma.pushToken.deleteMany({ where: { token: b.token, userId: s.sub } });
  return json({ ok: true });
});
