"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { clientApi } from "./clientApi";

// Cache simples em memória: ao voltar para uma tela, os dados anteriores aparecem na hora e são atualizados em seguida.
const cache = new Map<string, unknown>();
export const clearApiCache = () => cache.clear();

// GET com carregamento, erro e recarga. path = null desliga a consulta. interval (ms) atualiza sozinho enquanto a aba está à vista.
export function useApi<T = any>(path: string | null, opts: { interval?: number } = {}) {
  const [data, setData] = useState<T | undefined>(() => (path ? (cache.get(path) as T | undefined) : undefined));
  const [error, setError] = useState<(Error & { status?: number }) | null>(null);
  const [loading, setLoading] = useState(!!path && !cache.has(path));
  const alive = useRef(true);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);

  const load = useCallback(async () => {
    if (!path) return;
    try {
      const r = await clientApi(path);
      cache.set(path, r);
      if (alive.current) { setData(r); setError(null); }
    } catch (e: any) {
      if (alive.current) setError(e);
    } finally {
      if (alive.current) setLoading(false);
    }
  }, [path]);

  useEffect(() => {
    if (!path) { setData(undefined); setLoading(false); return; }
    setData(cache.get(path) as T | undefined);
    setLoading(!cache.has(path));
    setError(null);
    load();
  }, [path, load]);

  useEffect(() => {
    if (!path || !opts.interval) return;
    const tick = () => document.visibilityState === "visible" && load();
    const t = setInterval(tick, opts.interval);
    document.addEventListener("visibilitychange", tick);
    return () => { clearInterval(t); document.removeEventListener("visibilitychange", tick); };
  }, [path, opts.interval, load]);

  return { data, error, loading, reload: load, setData };
}
