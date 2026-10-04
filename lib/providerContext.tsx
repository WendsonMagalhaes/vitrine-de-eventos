"use client";
import { createContext, useContext } from "react";

export type Latest = { id: string; conversationId: string; from: string; body: string; createdAt: string };
// latest: undefined = ainda não consultou; null = nenhuma mensagem não lida.
export type ProviderCtx = { me: any; cats: any[]; reload: () => Promise<void>; unread: number; latest: Latest | null | undefined; refreshUnread: () => Promise<void> };
export const ProviderContext = createContext<ProviderCtx | null>(null);
export function useProvider() {
  const c = useContext(ProviderContext);
  if (!c) throw new Error("useProvider fora do painel do fornecedor");
  return c;
}
