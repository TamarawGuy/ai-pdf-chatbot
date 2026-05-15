import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import YoutubeSidebarServer from "@/components/youtube-sidebar-server";

export default function YoutubeBotLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider
      className="flex-1 min-h-0"
      style={{ "--sidebar-top": "4rem" } as React.CSSProperties}
    >
      <YoutubeSidebarServer />
      <SidebarInset className="flex flex-col min-h-0">
        <div className="flex items-center gap-2 border-b px-3 h-12 shrink-0">
          <SidebarTrigger />
        </div>
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
