import webpush from "web-push";
import { prisma } from "@/lib/prisma";

type Msg = { title: string; body: string; data?: Record<string, unknown> };

// Notificação push: celular (serviço do Expo) e navegador/PWA (Web Push). Falhar aqui nunca deve impedir o envio da mensagem.
export async function sendPushToUser(userId: string, msg: Msg) {
  await Promise.allSettled([sendExpoPush(userId, msg), sendWebPush(userId, msg)]);
}

async function sendExpoPush(userId: string, msg: Msg) {
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

// ---- Web Push (PWA) ----
// Chaves VAPID: gere com `npx web-push generate-vapid-keys` e coloque VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY e VAPID_SUBJECT (mailto:…) no ambiente.
let vapidReady: boolean | null = null;
export function webPushPublicKey() { return vapidConfigured() ? process.env.VAPID_PUBLIC_KEY! : null; }
function vapidConfigured() {
  if (vapidReady !== null) return vapidReady;
  const { VAPID_PUBLIC_KEY: pub, VAPID_PRIVATE_KEY: priv, VAPID_SUBJECT: subject } = process.env;
  if (!pub || !priv) return (vapidReady = false);
  try { webpush.setVapidDetails(subject || "mailto:contato@vitrine.local", pub, priv); vapidReady = true; }
  catch (e) { console.error("VAPID inválido", e); vapidReady = false; }
  return vapidReady;
}

// Quem recebe abre a conversa no lugar certo: como fornecedor (to = "provider") no painel, como cliente na vitrine.
// Um fornecedor pode receber dos dois lados, por isso o lado vem da própria conversa e não do perfil da conta.
const chatUrl = (to: unknown, conversationId?: unknown) =>
  typeof conversationId !== "string" ? (to === "provider" ? "/fornecedor/mensagens" : "/app/mensagens")
    : to === "provider" ? `/fornecedor/mensagens?c=${conversationId}` : `/app/chat/${conversationId}`;

async function sendWebPush(userId: string, msg: Msg) {
  if (!vapidConfigured()) return;
  const subs: any[] = await prisma.webPushSubscription.findMany({ where: { userId } });
  if (!subs.length) return;
  const dead: string[] = [];
  await Promise.all(subs.map(async (s) => {
    const payload = JSON.stringify({
      title: msg.title, body: msg.body, conversationId: msg.data?.conversationId ?? null,
      url: chatUrl(msg.data?.to, msg.data?.conversationId),
    });
    try {
      await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload, { TTL: 60 * 60 * 24, urgency: "high", timeout: 3000 });
    } catch (e: any) {
      if (e?.statusCode === 404 || e?.statusCode === 410) dead.push(s.endpoint); // inscrição expirou ou foi revogada
    }
  }));
  if (dead.length) await prisma.webPushSubscription.deleteMany({ where: { endpoint: { in: dead } } });
}
