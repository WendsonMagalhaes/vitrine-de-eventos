"use client";
import { useProvider } from "@/lib/providerContext";
import { PageHeader } from "@/lib/ui";
import ProfileTab from "../ProfileTab";

export default function Perfil() {
  const { me, cats, reload } = useProvider();
  return (<>
    <PageHeader title="Informações" description="É isso que os clientes veem no seu perfil." />
    <ProfileTab key={me.updatedAt} me={me} categories={cats} onSaved={reload} />
  </>);
}
