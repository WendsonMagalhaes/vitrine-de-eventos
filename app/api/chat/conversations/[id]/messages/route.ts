import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { json, route } from "@/lib/server";
import { messageInclude, participation, readField, serializeMessage, typingField } from "@/lib/chat";
import { TYPING_TTL_MS } from "@/lib/chatConstants";
import { sendPushToUser } from "@/lib/push";

export const dynamic = "force-dynamic";

// Sem "after": as últimas 50 mensagens. Com "after" (maior "updatedAt" que o app já viu): tudo o que mudou desde então,
// ou seja, mensagens novas, editadas, apagadas ou com reação nova. O app troca pela versão mais recente pelo id.
// Com "read=1" marca a conversa como lida.
export const GET = route(["CLIENT", "PROVIDER"], async (req, ctx, s) => {
  const { id } = await ctx.params;
  const part = await participation(id, s.sub);
  if (!part) return json({ error: "Conversa não encontrada" }, 404);
  const { conv, side } = part;
  const q = req.nextUrl.searchParams;
  const after = q.get("after") ? new Date(q.get("after")!) : null;

  let rows: any[];
  if (after && !Number.isNaN(after.getTime())) {
    rows = await prisma.message.findMany({ where: { conversationId: id, updatedAt: { gte: after } }, orderBy: { updatedAt: "asc" }, take: 200, include: messageInclude });
  } else {
    rows = (await prisma.message.findMany({ where: { conversationId: id }, orderBy: { createdAt: "desc" }, take: 50, include: messageInclude })).reverse();
  }

  if (q.get("read") === "1") {
    const mine: Date | null = conv[readField(side)];
    if (rows.some((m) => m.senderId !== s.sub && !m.deletedAt && (!mine || m.createdAt > mine))) {
      await prisma.conversation.update({ where: { id }, data: { [readField(side)]: new Date() } });
    }
  }
  const otherReadAt = side === "client" ? conv.providerReadAt : conv.clientReadAt;
  const typingAt: Date | null = side === "client" ? conv.providerTypingAt : conv.clientTypingAt;
  return json({ messages: rows.map(serializeMessage), otherReadAt, otherTyping: !!typingAt && Date.now() - typingAt.getTime() < TYPING_TTL_MS });
});

export const POST = route(["CLIENT", "PROVIDER"], async (req, ctx, s) => {
  const { id } = await ctx.params;
  const part = await participation(id, s.sub);
  if (!part) return json({ error: "Conversa não encontrada" }, 404);
  const { conv, side } = part;
  const { body, replyToId } = z.object({
    body: z.string().trim().min(1, "escreva uma mensagem").max(2000, "máximo de 2000 caracteres"),
    replyToId: z.string().min(1).nullable().optional(),
  }).parse(await req.json());
  if (conv.provider.status !== "APPROVED") return json({ error: "Esta conversa não está disponível no momento" }, 403);
  if (replyToId && !(await prisma.message.findFirst({ where: { id: replyToId, conversationId: id }, select: { id: true } }))) return json({ error: "Mensagem respondida não encontrada" }, 404);

  const msg = await prisma.message.create({ data: { conversationId: id, senderId: s.sub, body, replyToId: replyToId ?? null }, include: messageInclude });
  await prisma.conversation.update({ where: { id }, data: { lastMessageAt: msg.createdAt, [readField(side)]: msg.createdAt, [typingField(side)]: null } });

  const toUserId = side === "client" ? conv.provider.userId : conv.clientId;
  const fromName = side === "client" ? conv.client.name : conv.provider.name;
  await sendPushToUser(toUserId, { title: fromName, body: body.length > 120 ? `${body.slice(0, 117)}…` : body, data: { conversationId: id, to: side === "client" ? "provider" : "client" } });
  return json(serializeMessage(msg), 201);
});
