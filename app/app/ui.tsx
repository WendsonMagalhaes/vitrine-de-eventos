"use client";
import { useCallback, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Award, Building2, Camera, ChevronLeft, ChevronRight, Flower2, IceCream, Lightbulb, LoaderCircle, MessageCircleMore,
  Music, Phone, UtensilsCrossed, Wine, Wrench, LayoutGrid, Heart, MessageCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Thumb } from "@/lib/pastel";
import { clientApi } from "@/lib/clientApi";
import { useSession } from "@/lib/clientSession";

export const CAT_ICON: Record<string, LucideIcon> = {
  buffet: UtensilsCrossed, bebidas: Wine, decoracao: Flower2, "foto-e-video": Camera, musica: Music,
  espacos: Building2, "bolos-e-doces": IceCream, equipamentos: Wrench, iluminacao: Lightbulb, cerimonial: Award,
};
export const AllIcon = LayoutGrid;
export const catLine = (p: any) => p.categories.map((x: any) => x.category.name).join(" · ") + (p.city ? ` · ${p.city}` : "");
export const whatsappUrl = (num: string, msg: string) => `https://wa.me/${num.startsWith("55") ? num : `55${num}`}?text=${encodeURIComponent(msg)}`;
export const loginHref = (next?: string) => `/app/entrar${next ? `?next=${encodeURIComponent(next)}` : ""}`;

export function Loading({ full }: { full?: boolean }) {
  return <div className={full ? "v-loading full" : "v-loading"} role="status" aria-label="Carregando"><LoaderCircle className="spin" size={22} /></div>;
}
export const Notice = ({ children }: { children: React.ReactNode }) => <p className="v-mute v-notice">{children}</p>;
export const Tag = ({ text }: { text: string }) => <span className="v-tag">{text}</span>;
export const Chip = ({ label, on, onClick }: { label: string; on?: boolean; onClick?: () => void }) =>
  onClick ? <button type="button" className={`v-chip ${on ? "on" : ""}`} aria-pressed={on} onClick={onClick}>{label}</button> : <span className={`v-chip ${on ? "on" : ""}`}>{label}</span>;

// Barra de cima das telas de detalhe: voltar (ou ir para o início, se a tela foi aberta direto) e uma ação opcional.
export function TopBar({ title, fallback = "/app", right }: { title?: string; fallback?: string; right?: React.ReactNode }) {
  const router = useRouter();
  const back = () => { if (window.history.length > 1) router.back(); else router.push(fallback); };
  return (
    <header className="v-bar">
      <button className="icon v-back" onClick={back} aria-label="Voltar"><ChevronLeft size={22} /></button>
      <h1 className="v-bar-title">{title}</h1>
      <div className="v-bar-right">{right}</div>
    </header>
  );
}

export function ProviderCard({ p }: { p: any }) {
  return (
    <Link href={`/app/fornecedor/${p.id}`} className="v-card" aria-label={p.name}>
      <Thumb p={p} size={64} />
      <span className="v-card-body">
        <b>{p.name}</b>
        <span className="v-mute v-ellipsis">{catLine(p)}</span>
        {p.featured && <Tag text="Destaque" />}
      </span>
      <ChevronRight size={18} className="v-mute" />
    </Link>
  );
}

export function SignInPrompt({ icon: Icon, text, next }: { icon: LucideIcon; text: string; next?: string }) {
  return (
    <div className="v-center">
      <span className="v-tile"><Icon size={26} /></span>
      <p className="v-mute">{text}</p>
      <Link href={loginHref(next)} className="btn pri lg">Entrar</Link>
    </div>
  );
}
export const prompts = { heart: Heart, chat: MessageCircle };

// Abre (ou retoma) a conversa com um fornecedor. Visitante é levado ao login; fornecedor e admin não iniciam conversa.
export function useStartChat(providerId: string | undefined, next: string) {
  const { user } = useSession();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const canChat = !!providerId && (!user || user.role === "CLIENT");
  const start = useCallback(async () => {
    if (!user) { router.push(loginHref(next)); return; }
    setBusy(true);
    try {
      const r = await clientApi("/api/chat/conversations", { method: "POST", body: { providerId } });
      router.push(`/app/chat/${r.id}`);
    } catch (e: any) { toast.error(e.message); setBusy(false); }
  }, [user, providerId, next, router]);
  return { canChat, start, busy };
}

// Barra fixa embaixo do perfil/serviço: favoritar, mensagem, ligar e WhatsApp.
export function CtaBar({ p, message, onSave, saved, onChat, chatBusy }: { p: any; message: string; onSave?: () => void; saved?: boolean; onChat?: () => void; chatBusy?: boolean }) {
  return (
    <div className="v-cta">
      {onSave && <button className="v-cta-btn sq" onClick={onSave} aria-label={saved ? "Remover dos favoritos" : "Salvar nos favoritos"} aria-pressed={saved}><Heart size={21} className={saved ? "v-heart on" : "v-heart"} /></button>}
      {onChat && <button className="v-cta-btn" onClick={onChat} disabled={chatBusy} aria-label="Enviar mensagem no aplicativo"><MessageCircleMore size={19} /> Mensagem</button>}
      {p.phone && <a className="v-cta-btn sq" href={`tel:${p.phone}`} aria-label="Ligar"><Phone size={19} /></a>}
      {p.whatsapp && <a className="v-cta-btn wa" href={whatsappUrl(p.whatsapp, message)} target="_blank" rel="noopener noreferrer"><svg width="19" height="19" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20.5 3.5A11.8 11.8 0 0 0 12 0C5.4 0 .1 5.3.1 11.9c0 2.1.6 4.1 1.6 5.9L0 24l6.4-1.7a11.9 11.9 0 0 0 5.6 1.4c6.6 0 11.9-5.3 11.9-11.9 0-3.2-1.2-6.2-3.4-8.3ZM12 21.6a9.9 9.9 0 0 1-5-1.4l-.4-.2-3.8 1 1-3.7-.2-.4a9.9 9.9 0 1 1 8.4 4.7Zm5.4-7.4c-.3-.1-1.8-.9-2-1-.3-.1-.5-.1-.7.1l-.9 1.1c-.2.2-.3.2-.6.1-1.8-.9-3-1.6-4.2-3.6-.3-.5.3-.5.9-1.6.1-.2 0-.4 0-.5l-.9-2.2c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.1.2 2.1 3.2 5.1 4.5 1.9.8 2.6.9 3.5.8.6-.1 1.8-.7 2-1.4.3-.7.3-1.3.2-1.4-.1-.1-.3-.2-.6-.3Z" /></svg> WhatsApp</a>}
    </div>
  );
}
