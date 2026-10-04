"use client";
import Link from "next/link";
import { ChevronRight, CircleUserRound, LogOut, Store } from "lucide-react";
import { useSession } from "@/lib/clientSession";
import { InstallBanner } from "@/lib/pwa";
import { PushToggle } from "@/lib/webPush";
import { clientApi } from "@/lib/clientApi";
import { useRouter } from "next/navigation";

// Perfil do cliente (ou visitante). Fornecedor e administrador são levados aos próprios painéis.
export default function Perfil() {
  const { user, signOut } = useSession();
  const router = useRouter();
  return (
    <>
      <h1 className="v-h1">Perfil</h1>
      {user ? (
        <>
          <div className="v-profile">
            <span className="v-avatar-lg">{user.name[0]?.toUpperCase()}</span>
            <b>{user.name}</b>
            <span className="v-mute">{user.email ?? (user.role === "PROVIDER" ? "Fornecedor" : "Cliente")}</span>
          </div>
          {user.role === "PROVIDER" && (
            <Link href="/fornecedor" className="v-row-btn">
              <Store size={20} /><span>Meu painel de fornecedor</span><ChevronRight size={18} className="v-mute" />
            </Link>
          )}
          <InstallBanner ignoreDismiss />
          <PushToggle scope="/" api={clientApi} />
          <button className="v-row-btn" onClick={() => { signOut(); router.replace("/app"); }}>
            <LogOut size={20} /><span>Sair</span><ChevronRight size={18} className="v-mute" />
          </button>
        </>
      ) : (
        <div className="v-center top">
          <CircleUserRound size={64} className="v-brand-ico" strokeWidth={1.4} />
          <p className="v-mute">Entre para salvar seus fornecedores favoritos e conversar com eles.</p>
          <Link href="/login?next=/app" className="btn pri lg">Entrar ou criar conta</Link>
          <InstallBanner ignoreDismiss />
          <div className="v-promo">
            <b>Tem um negócio de eventos?</b>
            <p className="v-mute">Crie uma conta de fornecedor e apareça para quem está planejando uma festa.</p>
            <Link href="/login?modo=cadastro&tipo=fornecedor" className="v-link">Quero divulgar meus serviços</Link>
          </div>
        </div>
      )}
    </>
  );
}
