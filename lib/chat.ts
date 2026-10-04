import { prisma } from "@/lib/prisma";

export type Side = "client" | "provider";

// Carrega a conversa só se o usuário for um dos dois participantes (cliente ou dono do perfil).
export async function participation(conversationId: string, userId: string) {
  const conv = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: { client: { select: { id: true, name: true } }, provider: { select: { id: true, userId: true, name: true, status: true } } },
  });
  if (!conv) return null;
  const side: Side | null = conv.clientId === userId ? "client" : conv.provider.userId === userId ? "provider" : null;
  return side ? { conv, side } : null;
}
export const readField = (side: Side) => (side === "client" ? "clientReadAt" : "providerReadAt") as "clientReadAt" | "providerReadAt";
export const typingField = (side: Side) => (side === "client" ? "clientTypingAt" : "providerTypingAt") as "clientTypingAt" | "providerTypingAt";

// O que vem junto de cada mensagem: reações e a prévia da mensagem respondida.
export const messageInclude = {
  reactions: { select: { emoji: true, userId: true } },
  replyTo: { select: { id: true, body: true, senderId: true, deletedAt: true } },
} as const;

// Mensagem apagada nunca devolve o texto nem as reações.
export function serializeMessage(m: any) {
  const deleted = !!m.deletedAt;
  return {
    id: m.id,
    body: deleted ? "" : m.body,
    senderId: m.senderId,
    createdAt: m.createdAt,
    updatedAt: m.updatedAt,
    editedAt: m.editedAt ?? null,
    deleted,
    replyTo: m.replyTo ? { id: m.replyTo.id, senderId: m.replyTo.senderId, deleted: !!m.replyTo.deletedAt, body: m.replyTo.deletedAt ? "" : String(m.replyTo.body).slice(0, 140) } : null,
    reactions: deleted ? [] : (m.reactions ?? []),
  };
}
