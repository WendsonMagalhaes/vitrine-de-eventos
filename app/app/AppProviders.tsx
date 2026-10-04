"use client";
import { Toaster } from "sonner";
import { ConfirmProvider } from "@/lib/confirm";
import { SessionProvider } from "@/lib/clientSession";
import { useServiceWorker } from "@/lib/pwa";
import Frame from "./Frame";

export default function AppProviders({ children }: { children: React.ReactNode }) {
  useServiceWorker();
  return (
    <SessionProvider>
      <ConfirmProvider>
        <Frame>{children}</Frame>
        <Toaster position="top-center" offset={16} toastOptions={{ classNames: { toast: "vt-toast", success: "vt-success", error: "vt-error" } }} />
      </ConfirmProvider>
    </SessionProvider>
  );
}
