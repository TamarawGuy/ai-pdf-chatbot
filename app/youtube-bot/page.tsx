import { SidebarTrigger } from "@/components/ui/sidebar";
import YoutubeUrlForm from "@/components/youtube-url-form";

export default function NewYoutubeBotPage() {
  return (
    <div className="flex-1 min-h-0 flex flex-col">
      <div className="flex items-center gap-3 border-b px-3 h-12 shrink-0">
        <SidebarTrigger />
        <span className="text-sm font-medium">YouTube Chat</span>
      </div>
      <div className="flex-1 min-h-0 flex items-center justify-center px-4">
        <YoutubeUrlForm />
      </div>
    </div>
  );
}
