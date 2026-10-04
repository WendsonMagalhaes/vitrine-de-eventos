// Valores do chat usados pela API e pelo painel (arquivo sem dependências, pode ir para o navegador).
export const REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🙏"] as const;
export const EDIT_WINDOW_MS = 15 * 60 * 1000; // prazo para editar uma mensagem enviada
export const TYPING_TTL_MS = 5000;            // "digitando…" some depois disso sem novo sinal
