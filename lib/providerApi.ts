export const providerTokenKey = "provider_token";

const FIELD: Record<string, string> = {
  name: "Nome", phone: "Telefone", whatsapp: "WhatsApp", city: "Cidade", description: "Descrição", categoryIds: "Categorias",
};
function explain(data: any) {
  const fe = data?.details?.fieldErrors as Record<string, string[]> | undefined;
  const first = fe && Object.entries(fe).find(([, v]) => v?.length);
  return first ? `${data.error}: ${FIELD[first[0]] ?? first[0]} — ${first[1][0]}` : data?.error;
}

export async function providerApi(path: string, opts: { method?: string; body?: unknown } = {}) {
  const token = localStorage.getItem(providerTokenKey);
  const res = await fetch(path, {
    method: opts.method ?? "GET",
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw Object.assign(new Error(explain(data) ?? "Erro de conexão"), { status: res.status });
  return data;
}
