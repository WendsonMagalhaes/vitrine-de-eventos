"use client";
import { useCallback, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import ChatThread from "@/lib/ChatThread";
import { clientApi } from "@/lib/clientApi";
import { useSession } from "@/lib/clientSession";
import { useApi } from "@/lib/useApi";
import { Avatar } from "@/lib/ui";
import { Loading, SignInPrompt, TopBar } from "../../ui";
import { MessageCircle } from "lucide-react";

export default function ChatPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, ready, refreshUnread } = useSession();
  const convs = useApi<any[]>(user?.role === "CLIENT" ? "/api/chat/conversations" : null);
  const name = convs.data?.find((c) => c.id === id)?.other.name ?? "Conversa";
  const activity = useCallback(() => { refreshUnread(); convs.reload(); }, [refreshUnread, convs.reload]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { if (ready && user && user.role !== "CLIENT") router.replace(user.role === "ADMIN" ? "/admin" : "/fornecedor/mensagens"); }, [ready, user, router]);

  if (!ready) return <Loading full />;
  if (!user) return <><TopBar fallback="/app/mensagens" /><SignInPrompt icon={MessageCircle} text="Entre para conversar com os fornecedores." next={`/app/chat/${id}`} /></>;
  if (user.role !== "CLIENT") return <Loading full />;
  return (
    <div className="v-chat">
      <TopBar fallback="/app/mensagens" title={name} right={<Avatar name={name} />} />
      <ChatThread key={id} id={id} name={name} me={user.id} call={clientApi} onActivity={activity} />
    </div>
  );
}
