import { prisma } from "@/lib/prisma";
import { json, route } from "@/lib/server";

export const dynamic = "force-dynamic";

// Total de mensagens não lidas (número no ícone) e a mais recente delas (prévia do aviso flutuante).
// Leve o bastante para consultar a cada poucos segundos.
export const GET = route(["CLIENT", "PROVIDER"], async (_r, _c, s) => {
  const isClient = s.role === "CLIENT";
  const convs: any[] = await prisma.conversation.findMany({
    where: isClient ? { clientId: s.sub } : { provider: { userId: s.sub } },
    select: { id: true, clientReadAt: true, providerReadAt: true },
  });
  if (!convs.length) return json({ count: 0, latest: null });
  const where = { deletedAt: null, OR: convs.map((c) => ({ conversationId: c.id, senderId: { not: s.sub }, createdAt: { gt: (isClient ? c.clientReadAt : c.providerReadAt) ?? new Date(0) } })) };
  const [count, last] = await Promise.all([
    prisma.message.count({ where }),
    prisma.message.findFirst({
      where, orderBy: { createdAt: "desc" },
      select: { id: true, body: true, senderId: true, conversationId: true, createdAt: true,
        conversation: { select: { client: { select: { name: true } }, provider: { select: { name: true, userId: true } } } } },
    }),
  ]);
  const latest = last && {
    id: last.id, conversationId: last.conversationId, createdAt: last.createdAt,
    from: last.senderId === last.conversation.provider.userId ? last.conversation.provider.name : last.conversation.client.name,
    body: last.body.length > 140 ? `${last.body.slice(0, 137)}…` : last.body,
  };
  return json({ count, latest: latest ?? null });
});
