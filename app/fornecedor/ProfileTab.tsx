"use client";
import { useState } from "react";
import { toast } from "sonner";
import { providerApi } from "@/lib/providerApi";
import { Field } from "@/lib/ui";
import { PhoneInput, phoneError } from "@/lib/mask";
import { Badge } from "@/lib/providerActions";

export default function ProfileTab({ me, categories, onSaved }: { me: any; categories: any[]; onSaved: () => void }) {
  const [f, setF] = useState({
    name: me.name ?? "", city: me.city ?? "", whatsapp: me.whatsapp ?? "", phone: me.phone ?? "", description: me.description ?? "",
    categoryIds: me.categories.map((c: any) => c.categoryId) as string[],
  });
  const [busy, setBusy] = useState(false);
  const set = (k: string, v: any) => setF((s) => ({ ...s, [k]: v }));
  const toggle = (id: string) => set("categoryIds", f.categoryIds.includes(id) ? f.categoryIds.filter((x) => x !== id) : [...f.categoryIds, id]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const bad = phoneError(f.whatsapp, "WhatsApp") || phoneError(f.phone, "Telefone");
    if (bad) return toast.error(bad);
    setBusy(true);
    try {
      await providerApi("/api/providers/me", { method: "PUT", body: {
        name: f.name, city: f.city.trim() || null, whatsapp: f.whatsapp || null, phone: f.phone || null,
        description: f.description.trim() || null, categoryIds: f.categoryIds,
      } });
      toast.success("Informações salvas"); onSaved();
    } catch (err: any) { toast.error(err.message); } finally { setBusy(false); }
  }

  return (
    <form className="cols" onSubmit={submit}>
      <div className="stack">
        <section className="card">
          <div className="card-head"><div><h2>Dados do negócio</h2><p className="mute" style={{ margin: 0 }}>Nome e formas de contato que aparecem para os clientes.</p></div></div>
          <div className="card-body form-grid">
            <Field className="span2" label="Nome do seu negócio"><input value={f.name} onChange={(e) => set("name", e.target.value)} required minLength={2} maxLength={120} /></Field>
            <Field label="Cidade"><input value={f.city} onChange={(e) => set("city", e.target.value)} maxLength={80} placeholder="Campina Grande" /></Field>
            <span />
            <Field label="WhatsApp"><PhoneInput value={f.whatsapp} onChange={(v) => set("whatsapp", v)} /></Field>
            <Field label="Telefone (opcional)"><PhoneInput value={f.phone} onChange={(v) => set("phone", v)} placeholder="(83) 3333-4444" /></Field>
          </div>
        </section>

        <section className="card">
          <div className="card-head"><div><h2>Sobre o seu trabalho</h2><p className="mute" style={{ margin: 0 }}>Conte o que você faz e o que te diferencia.</p></div></div>
          <div className="card-body">
            <textarea style={{ minHeight: 160 }} aria-label="Descrição" value={f.description} onChange={(e) => set("description", e.target.value)} maxLength={2000} placeholder="Ex.: Decoração para casamentos e aniversários na Paraíba, com flores naturais e montagem completa." />
            <div className="pf-count num">{f.description.length}/2000</div>
          </div>
        </section>

        <section className="card">
          <div className="card-head"><div><h2>Categorias</h2><p className="mute" style={{ margin: 0 }}>Escolha até 5 para ser encontrado nas buscas.</p></div><span className="counter num">{f.categoryIds.length}/5</span></div>
          <div className="card-body">
            <div className="chips tight">
              {categories.map((c) => {
                const on = f.categoryIds.includes(c.id);
                return <button type="button" key={c.id} className={`chip ${on ? "on" : ""}`} aria-pressed={on} disabled={!on && f.categoryIds.length >= 5} onClick={() => toggle(c.id)}>{c.name}</button>;
              })}
            </div>
          </div>
        </section>
      </div>

      <div className="stack sticky">
        <section className="card">
          <div className="card-head"><h2>Publicação</h2><Badge status={me.status} /></div>
          <div className="card-body"><button className="btn pri block lg" disabled={busy}>{busy ? "Salvando…" : "Salvar informações"}</button></div>
        </section>
        <section className="card card-body pf-tip">
          <b>Dicas para chamar atenção</b>
          <span>Use um nome fácil de reconhecer, o mesmo das suas redes.</span>
          <span>Na descrição, cite o tipo de evento, o diferencial e a região que atende.</span>
          <span>Confira o WhatsApp: é por ele que os clientes entram em contato.</span>
        </section>
      </div>
    </form>
  );
}
