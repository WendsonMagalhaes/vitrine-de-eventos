import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { json, route } from "@/lib/server";
import { messageInclude, participation, serializeMessage } from "@/lib/chat";
import { EDIT_WINDOW_MS } from "@/lib/chatConstants";

// Só o autor mexe na própria mensagem (e precisa ser participante da conversa).
async function loadOwn(mid: string, userId: string) {
  const m = await prisma.message.findUnique({ where: { id: mid }, select: { id: true, conversationId: true, senderId: true, createdAt: true, deletedAt: true } });
  if (!m) return { error: json({ error: "Mensagem não encontrada" }, 404) };
  if (!(await participation(m.conversationId, userId))) return { error: json({ error: "Mensagem não encontrada" }, 404) };
  if (m.senderId !== userId) return { error: json({ error: "Você só pode alterar as suas mensagens" }, 403) };
  return { m };
}

export const PATCH = route(["CLIENT", "PROVIDER"], async (req, ctx, s) => {
  const { mid } = await ctx.params;
  const { body } = z.object({ body: z.string().trim().min(1, "escreva uma mensagem").max(2000, "máximo de 2000 caracteres") }).parse(await req.json());
  const r = await loadOwn(mid, s.sub);
  if (r.error) return r.error;
  if (r.m.deletedAt) return json({ error: "Mensagem apagada não pode ser editada" }, 409);
  if (Date.now() - r.m.createdAt.getTime() > EDIT_WINDOW_MS) return json({ error: "O prazo para editar (15 minutos) acabou" }, 403);
  const updated = await prisma.message.update({ where: { id: mid }, data: { body, editedAt: new Date() }, include: messageInclude });
  return json(serializeMessage(updated));
});

// Apagar remove o texto para os dois lados; fica um aviso de "mensagem apagada".
export const DELETE = route(["CLIENT", "PROVIDER"], async (_req, ctx, s) => {
  const { mid } = await ctx.params;
  const r = await loadOwn(mid, s.sub);
  if (r.error) return r.error;
  if (r.m.deletedAt) return json({ ok: true });
  await prisma.message.update({ where: { id: mid }, data: { body: "", deletedAt: new Date() } });
  await prisma.messageReaction.deleteMany({ where: { messageId: mid } });
  return json({ ok: true });
});
