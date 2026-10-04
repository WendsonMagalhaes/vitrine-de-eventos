// Chamadas da API para o app web do cliente (/app). O token fica no navegador, como nos painéis.
export const clientTokenKey = "vitrine_token";
export const clientUserKey = "vitrine_user";

const FIELD: Record<string, string> = { name: "Nome", email: "E-mail", password: "Senha", providerId: "Fornecedor" };
function explain(data: any) {
  const fe = data?.details?.fieldErrors as Record<string, string[]> | undefined;
  const first = fe && Object.entries(fe).find(([, v]) => v?.length);
  return first ? `${data.error}: ${FIELD[first[0]] ?? first[0]} — ${first[1][0]}` : data?.error;
}

export async function clientApi(path: string, opts: { method?: string; body?: unknown } = {}) {
  let token: string | null = null;
  try { token = localStorage.getItem(clientTokenKey); } catch { /* armazenamento bloqueado */ }
  const res = await fetch(path, {
    method: opts.method ?? "GET",
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw Object.assign(new Error(explain(data) ?? "Erro de conexão"), { status: res.status });
  return data;
}
