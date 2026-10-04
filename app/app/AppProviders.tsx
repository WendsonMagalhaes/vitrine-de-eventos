"use client";
import { Toaster } from "sonner";
import { ConfirmProvider } from "@/lib/confirm";
import { SessionProvider } from "@/lib/clientSession";
import Frame from "./Frame";
import { DockProvider } from "./ClientDock";

export default function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ConfirmProvider>
        <DockProvider>
          <Frame>{children}</Frame>
        </DockProvider>
        <Toaster position="top-center" offset={16} toastOptions={{ classNames: { toast: "vt-toast", success: "vt-success", error: "vt-error" } }} />
      </ConfirmProvider>
    </SessionProvider>
  );
}