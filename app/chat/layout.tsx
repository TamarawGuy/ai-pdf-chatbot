import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import AppSidebarServer from "@/components/app-sidebar-server";
import UploadPdfDialog from "@/components/upload-pdf-dialog";

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider
      className="flex-1 min-h-0"
      style={{ "--sidebar-top": "4rem" } as React.CSSProperties}
    >
      <AppSidebarServer />
      <SidebarInset className="flex flex-col min-h-0">
        <div className="flex items-center gap-2 border-b px-3 h-12 shrink-0">
          <SidebarTrigger />
          <div className="ml-auto">
            <UploadPdfDialog />
          </div>
        </div>
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
