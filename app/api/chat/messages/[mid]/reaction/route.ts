import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { json, route } from "@/lib/server";
import { participation } from "@/lib/chat";
import { REACTIONS } from "@/lib/chatConstants";
import { sendPushToUser } from "@/lib/push";

// Reagir: { emoji } troca/define a sua reação; { emoji: null } remove. Qualquer participante pode reagir.
export const PUT = route(["CLIENT", "PROVIDER"], async (req, ctx, s) => {
  const { mid } = await ctx.params;
  const { emoji } = z.object({ emoji: z.enum(REACTIONS).nullable() }).parse(await req.json());
  const m = await prisma.message.findUnique({ where: { id: mid }, select: { id: true, conversationId: true, senderId: true, deletedAt: true } });
  const part = m ? await participation(m.conversationId, s.sub) : null;
  if (!m || !part) return json({ error: "Mensagem não encontrada" }, 404);
  if (m.deletedAt) return json({ error: "Mensagem apagada" }, 409);

  if (emoji === null) await prisma.messageReaction.deleteMany({ where: { messageId: mid, userId: s.sub } });
  else await prisma.messageReaction.upsert({ where: { messageId_userId: { messageId: mid, userId: s.sub } }, update: { emoji }, create: { messageId: mid, userId: s.sub, emoji } });
  await prisma.message.update({ where: { id: mid }, data: { updatedAt: new Date() } }); // faz a reação aparecer para o outro lado

  if (emoji && m.senderId !== s.sub) {
    const who = part.side === "client" ? part.conv.client.name : part.conv.provider.name;
    await sendPushToUser(m.senderId, { title: who, body: `reagiu ${emoji} à sua mensagem`, data: { conversationId: m.conversationId, to: part.side === "client" ? "provider" : "client" } });
  }
  return json({ ok: true });
});
