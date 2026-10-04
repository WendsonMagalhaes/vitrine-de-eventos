import { prisma } from "@/lib/prisma";

// Notificação push pelo serviço do Expo. Falhar aqui nunca deve impedir o envio da mensagem.
export async function sendPushToUser(userId: string, msg: { title: string; body: string; data?: Record<string, unknown> }) {
  const tokens: { token: string }[] = await prisma.pushToken.findMany({ where: { userId }, select: { token: true } });
  if (!tokens.length) return;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 3000);
  try {
    const res = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST", signal: ctrl.signal,
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(tokens.map((t) => ({ to: t.token, title: msg.title, body: msg.body, data: msg.data ?? {}, sound: "default", priority: "high", channelId: "messages" }))),
    });
    const out = await res.json().catch(() => null);
    // Aparelhos que desinstalaram o app: limpa o token para não tentar de novo.
    const dead = (out?.data ?? []).map((t: any, i: number) => (t?.status === "error" && t?.details?.error === "DeviceNotRegistered" ? tokens[i].token : null)).filter(Boolean);
    if (dead.length) await prisma.pushToken.deleteMany({ where: { token: { in: dead } } });
  } catch { /* sem push desta vez */ } finally { clearTimeout(timer); }
}
