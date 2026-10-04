export const tokenKey = "admin_token";

const FIELD: Record<string, string> = {
  name: "Nome", email: "E-mail", password: "Senha", phone: "Telefone", whatsapp: "WhatsApp", city: "Cidade",
  description: "Descrição", categoryIds: "Categorias", title: "Título", subtitle: "Subtítulo", imageUrl: "Imagem",
  priceFrom: "Preço", includes: "Itens inclusos", sortOrder: "Ordem", role: "Tipo",
};

// "Dados inválidos" sozinho não ajuda: acrescenta o primeiro campo com problema.
function explain(data: any) {
  const fe = data?.details?.fieldErrors as Record<string, string[]> | undefined;
  const first = fe && Object.entries(fe).find(([, v]) => v?.length);
  return first ? `${data.error}: ${FIELD[first[0]] ?? first[0]} — ${first[1][0]}` : data?.error;
}

export async function adminApi(path: string, opts: { method?: string; body?: unknown } = {}) {
  const token = localStorage.getItem(tokenKey);
  const res = await fetch(path, {
    method: opts.method ?? "GET",
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw Object.assign(new Error(explain(data) ?? "Erro de conexão"), { status: res.status });
  return data;
}
