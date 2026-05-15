import { listYoutubeChats } from "@/lib/youtube/chats";
import YoutubeSidebar from "@/components/youtube-sidebar";

export default async function YoutubeSidebarServer() {
  const chats = await listYoutubeChats();
  return (
    <YoutubeSidebar
      chats={chats.map((c) => ({
        id: c.id,
        title: c.title,
        updatedAt: c.updatedAt.toISOString(),
      }))}
    />
  );
}
