"use client";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { useApi } from "@/lib/useApi";
import { Chip, Loading, Notice, ProviderCard } from "../ui";

function BuscarInner() {
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");
  const [cat, setCat] = useState<string | null>(params.get("category"));
  const [dq, setDq] = useState(q);
  useEffect(() => { setCat(params.get("category")); }, [params]);
  useEffect(() => { const t = setTimeout(() => setDq(q.trim()), 250); return () => clearTimeout(t); }, [q]);

  const cats = useApi<any[]>("/api/categories");
  const list = useApi<any[]>(`/api/providers?limit=50&q=${encodeURIComponent(dq)}${cat ? `&category=${cat}` : ""}`);
  return (
    <>
      <h1 className="v-h1">Buscar</h1>
      <div className="v-search" role="search">
        <Search size={18} />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar buffet, fotógrafo, espaço…" aria-label="Buscar fornecedores" enterKeyHint="search" autoFocus={!params.get("category")} />
        {q !== "" && <button className="icon" onClick={() => setQ("")} aria-label="Limpar busca"><X size={16} /></button>}
      </div>
      <div className="v-chips" role="group" aria-label="Filtrar por categoria">
        {(cats.data ?? []).map((c) => <Chip key={c.id} label={c.name} on={cat === c.slug} onClick={() => setCat(cat === c.slug ? null : c.slug)} />)}
      </div>
      {list.loading ? <Loading /> : (
        <>
          <p className="v-mute v-count" aria-live="polite">{list.data?.length ?? 0} resultado(s)</p>
          {list.error ? <Notice>Não foi possível carregar.</Notice>
            : !list.data?.length ? <Notice>Nenhum fornecedor encontrado. Tente outra busca.</Notice>
            : <div className="v-list">{list.data.map((p) => <ProviderCard key={p.id} p={p} />)}</div>}
        </>
      )}
    </>
  );
}

export default function Buscar() {
  return <Suspense fallback={<Loading />}><BuscarInner /></Suspense>;
}
