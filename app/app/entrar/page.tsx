import { redirect } from "next/navigation";

// A tela de login agora é única: /login (mantém ?next, ?modo e ?tipo dos links antigos).
export default async function Entrar({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) if (typeof v === "string") qs.set(k, v);
  redirect(`/login${qs.size ? `?${qs}` : ""}`);
}
