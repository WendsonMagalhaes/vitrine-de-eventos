import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { json, route } from "@/lib/server";

export const dynamic = "force-dynamic";

// Lista as conversas de quem está logado, a mais recente primeiro, com o que não foi lido.
// Cliente vê as suas conversas com fornecedores. Fornecedor vê as que recebeu; com ?as=client vê as que ele abriu como cliente na vitrine.
export const GET = route(["CLIENT", "PROVIDER"], async (req, _c, s) => {
  const isClient = s.role === "CLIENT" || req.nextUrl.searchParams.get("as") === "client";
  const convs: any[] = await prisma.conversation.findMany({
    where: { messages: { some: {} }, ...(isClient ? { clientId: s.sub } : { provider: { userId: s.sub } }) },
    orderBy: { lastMessageAt: "desc" }, take: 100,
    include: {
      client: { select: { id: true, name: true } },
      provider: { select: { id: true, name: true, images: { orderBy: { sortOrder: "asc" }, take: 1, select: { url: true } } } },
      messages: { orderBy: { createdAt: "desc" }, take: 1, select: { id: true, body: true, senderId: true, createdAt: true, deletedAt: true } },
    },
  });
  const readAt = (c: any): Date => (isClient ? c.clientReadAt : c.providerReadAt) ?? new Date(0);
  const unread: number[] = await Promise.all(convs.map((c) => prisma.message.count({ where: { conversationId: c.id, senderId: { not: s.sub }, deletedAt: null, createdAt: { gt: readAt(c) } } })));
  return json(convs.map((c, i) => ({
    id: c.id,
    other: isClient ? { name: c.provider.name, imageUrl: c.provider.images[0]?.url ?? null, providerId: c.provider.id } : { name: c.client.name, imageUrl: null, providerId: null },
    lastMessage: c.messages[0] ? { id: c.messages[0].id, body: c.messages[0].deletedAt ? "" : c.messages[0].body, deleted: !!c.messages[0].deletedAt, mine: c.messages[0].senderId === s.sub, createdAt: c.messages[0].createdAt } : null,
    lastMessageAt: c.lastMessageAt,
    unread: unread[i],
  })));
});

// Abre (ou retoma) a conversa com um fornecedor publicado. Vale para cliente e para fornecedor (como cliente de outro fornecedor).
export const POST = route(["CLIENT", "PROVIDER"], async (req, _c, s) => {
  const { providerId } = z.object({ providerId: z.string().min(1) }).parse(await req.json());
  const provider = await prisma.provider.findFirst({ where: { id: providerId, status: "APPROVED" }, select: { id: true, userId: true } });
  if (!provider) return json({ error: "Fornecedor indisponível" }, 404);
  if (provider.userId === s.sub) return json({ error: "Você não pode conversar consigo mesmo" }, 400);
  const conv = await prisma.conversation.upsert({
    where: { clientId_providerId: { clientId: s.sub, providerId } }, update: {}, create: { clientId: s.sub, providerId },
  });
  return json({ id: conv.id });
});
