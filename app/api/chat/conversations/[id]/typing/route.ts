import { prisma } from "@/lib/prisma";
import { json, route } from "@/lib/server";
import { participation, typingField } from "@/lib/chat";

// O app avisa a cada poucos segundos que a pessoa está digitando ("digitando…" para o outro lado).
export const POST = route(["CLIENT", "PROVIDER"], async (_r, ctx, s) => {
  const { id } = await ctx.params;
  const part = await participation(id, s.sub);
  if (!part) return json({ error: "Conversa não encontrada" }, 404);
  await prisma.conversation.update({ where: { id }, data: { [typingField(part.side)]: new Date() } });
  return json({ ok: true });
});
