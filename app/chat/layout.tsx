import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import AppSidebarServer from "@/components/app-sidebar-server";

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider
      className="flex-1 min-h-0"
      style={{ "--sidebar-top": "4rem" } as React.CSSProperties}
    >
      <AppSidebarServer />
      <SidebarInset className="flex flex-col min-h-0">
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
