"use client";
import { useState } from "react";
import { Heart } from "lucide-react";
import { useApi } from "@/lib/useApi";
import { useSession } from "@/lib/clientSession";
import { Chip, Loading, Notice, ProviderCard, SignInPrompt } from "../ui";

export default function Favoritos() {
  const { user } = useSession();
  const [cat, setCat] = useState<string | null>(null);
  const { data, loading } = useApi<any[]>(user && user.role !== "ADMIN" ? "/api/favorites" : null);
  if (!user) return <SignInPrompt icon={Heart} text="Entre para salvar e ver seus favoritos." next="/app/favoritos" />;

  const names = [...new Set<string>((data ?? []).flatMap((p) => p.categories.map((x: any) => x.category.name)))];
  const shown = (data ?? []).filter((p) => !cat || p.categories.some((x: any) => x.category.name === cat));
  return (
    <>
      <h1 className="v-h1">Favoritos</h1>
      <p className="v-mute v-sub">{data?.length ?? 0} fornecedor(es) salvo(s)</p>
      {names.length > 0 && (
        <div className="v-chips" role="group" aria-label="Filtrar por categoria">
          {["Todos", ...names].map((n) => <Chip key={n} label={n} on={(n === "Todos" && !cat) || n === cat} onClick={() => setCat(n === "Todos" ? null : n)} />)}
        </div>
      )}
      {loading ? <Loading /> : shown.length === 0 ? <Notice>Você ainda não salvou nenhum fornecedor.</Notice>
        : <div className="v-list">{shown.map((p) => <ProviderCard key={p.id} p={p} />)}</div>}
    </>
  );
}
