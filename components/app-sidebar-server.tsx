import { listChats } from "@/lib/chats";
import AppSidebar from "@/components/app-sidebar";

export default async function AppSidebarServer() {
  const chats = await listChats();
  return (
    <AppSidebar
      chats={chats.map((c) => ({
        id: c.id,
        title: c.title,
        updatedAt: c.updatedAt.toISOString(),
      }))}
    />
  );
}
