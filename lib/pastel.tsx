import { Image as ImageIcon } from "lucide-react";

const PASTELS = ["#E3CBEF", "#C3E6DA", "#F9DDBC", "#C9D9F4"];
export const pastel = (key: string) => PASTELS[[...key].reduce((a, ch) => a + ch.charCodeAt(0), 0) % PASTELS.length];

// Mesma lógica do app: foto do fornecedor ou bloco pastel.
export function Thumb({ p, size = 46 }: { p: any; size?: number }) {
  const url = p.images?.[0]?.url;
  const style = { width: size, height: size, borderRadius: size > 60 ? 14 : 10 };
  return url ? <img src={url} alt="" className="thumb" style={style} /> : (
    <span className="thumb" style={{ ...style, background: pastel(p.id) }}><ImageIcon size={size / 2.6} /></span>
  );
}
