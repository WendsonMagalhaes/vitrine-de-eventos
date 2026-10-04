"use client";
import { useState } from "react";
import { toast } from "sonner";
import { providerApi } from "@/lib/providerApi";
import { Field, Modal } from "@/lib/ui";
import { MoneyInput } from "@/lib/mask";
import ServiceImage, { ServiceImg } from "@/lib/ServiceImage";

export default function ServiceModal({ service, onClose, onSaved }: { service?: any; onClose: () => void; onSaved: () => void }) {
  const edit = !!service;
  const [name, setName] = useState(service?.name ?? "");
  const [description, setDescription] = useState(service?.description ?? "");
  const [price, setPrice] = useState<number | null>(service?.priceFrom ?? null);
  const [includes, setIncludes] = useState((service?.includes ?? []).join("\n"));
  const [image, setImage] = useState<ServiceImg>(service?.imageUrl ? { url: service.imageUrl, publicId: service.imagePublicId } : null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true);
    const body = {
      name, description: description.trim() || null, priceFrom: price, includes: includes.split("\n").map((s: string) => s.trim()).filter(Boolean),
      imageUrl: image?.url ?? null, imagePublicId: image?.publicId ?? null,
    };
    try {
      await providerApi(edit ? `/api/services/${service.id}` : "/api/services", { method: edit ? "PUT" : "POST", body });
      toast.success(edit ? "Serviço atualizado" : "Serviço adicionado"); onSaved(); onClose();
    } catch (err: any) { toast.error(err.message); } finally { setBusy(false); }
  }

  return (
    <Modal title={edit ? "Editar serviço" : "Novo serviço"} onClose={onClose}>
      <form onSubmit={submit}>
        <div className="modal-body">
          <ServiceImage value={image} onChange={setImage} sign={() => providerApi("/api/uploads/sign", { method: "POST" })} />
          <Field label="Nome do serviço"><input value={name} onChange={(e) => setName(e.target.value)} required minLength={2} maxLength={120} autoFocus placeholder="Ex.: Decoração de casamento" /></Field>
          <Field label="Descrição"><textarea value={description} onChange={(e) => setDescription(e.target.value)} maxLength={1000} placeholder="O que está incluso, para quantas pessoas, etc." /></Field>
          <Field label="A partir de" hint="Deixe vazio para mostrar “sob consulta”"><MoneyInput value={price} onChange={setPrice} /></Field>
          <Field label="O que inclui" hint="Um item por linha (máx. 15)"><textarea value={includes} onChange={(e) => setIncludes(e.target.value)} placeholder={"Flores naturais da estação\nMontagem e desmontagem"} /></Field>
        </div>
        <div className="modal-foot">
          <button type="button" className="btn" onClick={onClose}>Cancelar</button>
          <button className="btn pri" disabled={busy}>{busy ? "Salvando…" : "Salvar"}</button>
        </div>
      </form>
    </Modal>
  );
}
