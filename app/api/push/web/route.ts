import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { json, route } from "@/lib/server";
import { webPushPublicKey } from "@/lib/push";

export const dynamic = "force-dynamic";

const sub = z.object({
  endpoint: z.string().url().max(1000),
  keys: z.object({ p256dh: z.string().min(10).max(200), auth: z.string().min(10).max(100) }),
});

// Chave pública (VAPID) para o navegador criar a inscrição. 503 = o servidor ainda não tem as chaves configuradas.
export const GET = route(null, async () => {
  const publicKey = webPushPublicKey();
  return publicKey ? json({ publicKey }) : json({ error: "Notificações indisponíveis" }, 503);
});

// O navegador registra a inscrição para receber avisos de mensagens. O mesmo aparelho pode trocar de conta:
// a inscrição passa a pertencer a quem entrou por último.
export const POST = route(["CLIENT", "PROVIDER"], async (req, _c, s) => {
  const b = sub.parse(await req.json());
  await prisma.webPushSubscription.upsert({
    where: { endpoint: b.endpoint },
    update: { userId: s.sub, p256dh: b.keys.p256dh, auth: b.keys.auth },
    create: { userId: s.sub, endpoint: b.endpoint, p256dh: b.keys.p256dh, auth: b.keys.auth },
  });
  return json({ ok: true }, 201);
});

export const DELETE = route(["CLIENT", "PROVIDER"], async (req, _c, s) => {
  const { endpoint } = z.object({ endpoint: z.string().min(1).max(1000) }).parse(await req.json());
  await prisma.webPushSubscription.deleteMany({ where: { endpoint, userId: s.sub } });
  return json({ ok: true });
});
