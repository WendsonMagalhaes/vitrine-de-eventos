// O que falta para o perfil poder ser enviado para análise. Usado na API e na tela.
export type CheckItem = { label: string; href: string; done: boolean };

export function checklist(p: any): CheckItem[] {
  return [
    { label: "descrição", href: "/fornecedor/perfil", done: !!p?.description?.trim() },
    { label: "cidade", href: "/fornecedor/perfil", done: !!p?.city?.trim() },
    { label: "WhatsApp ou telefone", href: "/fornecedor/perfil", done: !!(p?.whatsapp || p?.phone) },
    { label: "ao menos 1 categoria", href: "/fornecedor/perfil", done: !!p?.categories?.length },
    { label: "ao menos 1 foto", href: "/fornecedor/fotos", done: !!p?.images?.length },
  ];
}

// Usado pela API (/api/providers/me/submit): só os nomes do que falta.
export function missingFields(p: any): string[] {
  return checklist(p).filter((i) => !i.done).map((i) => i.label);
}

// Usado pela tela inicial: o que falta, com o link de cada item.
export function missingItems(p: any): CheckItem[] {
  return checklist(p).filter((i) => !i.done);
}
