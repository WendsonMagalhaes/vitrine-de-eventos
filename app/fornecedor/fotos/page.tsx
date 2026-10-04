"use client";
import { useProvider } from "@/lib/providerContext";
import { PageHeader } from "@/lib/ui";
import PhotosTab from "../PhotosTab";

export default function Fotos() {
  const { me, reload } = useProvider();
  return (<>
    <PageHeader title="Fotos" description="Mostre o seu melhor trabalho. Boas fotos aumentam as chances de contato." />
    <PhotosTab images={me.images} onChange={reload} />
  </>);
}
