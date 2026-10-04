"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Image as ImageIcon, Search } from "lucide-react";
import { useApi } from "@/lib/useApi";
import { useSession } from "@/lib/clientSession";
import { pastel } from "@/lib/pastel";
import { AllIcon, CAT_ICON, Loading, Notice, ProviderCard, Tag, catLine } from "./ui";

// Mesmas cores pastel do painel (campo "color" do banner).
const BANNER_BG: Record<string, string> = { lilac: "#E3CBEF", mint: "#C3E6DA", peach: "#F9DDBC", sky: "#C9D9F4" };

function Banners({ items }: { items: any[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [idx, setIdx] = useState(0);
  const onScroll = () => {
    const el = ref.current, first = el?.firstElementChild as HTMLElement | undefined;
    if (!el || !first) return;
    setIdx(Math.min(items.length - 1, Math.max(0, Math.round(el.scrollLeft / (first.offsetWidth + 10)))));
  };
  return (
    <section aria-label="Destaques">
      <div className="v-banners" ref={ref} onScroll={onScroll}>
        {items.map((b) => {
          const inner = (<>
            {b.imageUrl && <img src={b.imageUrl} alt="" className="v-banner-img" />}
            {b.imageUrl && <span className="v-banner-shade" />}
            <b className={b.imageUrl ? "on-img" : ""}>{b.title}</b>
            {!!b.subtitle && <span className={`v-banner-sub ${b.imageUrl ? "on-img" : ""}`}>{b.subtitle}</span>}
          </>);
          const style = { background: BANNER_BG[b.color] ?? BANNER_BG.lilac };
          return b.providerId
            ? <Link key={b.id} href={`/app/fornecedor/${b.providerId}`} className="v-banner" style={style}>{inner}</Link>
            : <div key={b.id} className="v-banner" style={style}>{inner}</div>;
        })}
      </div>
      {items.length > 1 && <div className="v-dots" aria-hidden="true">{items.map((b, i) => <span key={b.id} className={i === idx ? "on" : ""} />)}</div>}
    </section>
  );
}

export default function Home() {
  const router = useRouter();
  const { user } = useSession();
  const [q, setQ] = useState("");
  const cats = useApi<any[]>("/api/categories");
  const list = useApi<any[]>("/api/providers?limit=20");
  const banners = useApi<any[]>("/api/banners");
  const featured = list.data?.find((p) => p.featured);
  const hasBanners = (banners.data?.length ?? 0) > 0;
  const items = [...(cats.data ?? []).slice(0, 7), { id: "all", name: "Ver todas", slug: "" }];

  return (
    <>
      <h1 className="v-h1">Olá{user ? `, ${user.name.split(" ")[0]}` : ""}</h1>
      <p className="v-mute v-sub">O que seu evento precisa?</p>
      <form className="v-search" role="search" onSubmit={(e) => { e.preventDefault(); router.push(`/app/buscar${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ""}`); }}>
        <Search size={18} />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar buffet, fotógrafo, espaço…" aria-label="Buscar fornecedores" enterKeyHint="search" />
      </form>

      <nav className="v-cats" aria-label="Categorias">
        {items.map((cat: any) => {
          const Icon = CAT_ICON[cat.slug] ?? AllIcon;
          return (
            <Link key={cat.id} href={cat.slug ? `/app/buscar?category=${cat.slug}` : "/app/buscar"}>
              <span className="v-cat-ico"><Icon size={24} /></span>
              <span className="v-cat-name">{cat.name}</span>
            </Link>
          );
        })}
      </nav>

      {hasBanners ? <Banners items={banners.data!} /> : featured && (
        <Link href={`/app/fornecedor/${featured.id}`} className="v-banner v-featured" style={{ background: pastel(featured.id) }}>
          {featured.images[0] ? <img src={featured.images[0].url} alt="" className="v-banner-img" /> : <ImageIcon className="v-banner-ph" size={36} />}
          <span className="v-featured-tag"><Tag text="Destaque" /></span>
          <span className="v-featured-box"><b>{featured.name}</b><span>{catLine(featured)}</span></span>
        </Link>
      )}

      <h2 className="v-h2">Fornecedores</h2>
      {list.loading ? <Loading /> : list.error ? <Notice>Não foi possível carregar. Verifique a conexão e tente de novo.</Notice>
        : !list.data?.length ? <Notice>Ainda não há fornecedores publicados.</Notice>
        : <div className="v-list">{list.data.map((p) => <ProviderCard key={p.id} p={p} />)}</div>}
    </>
  );
}
