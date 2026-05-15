import { notFound } from "next/navigation";
import ChatView from "@/components/chat-view";
import { getChat } from "@/lib/pdf-chat/chats";

export default async function ExistingChatPage({
  params,
}: {
  params: Promise<{ chatId: string }>;
}) {
  const { chatId } = await params;
  const data = await getChat(chatId);
  if (!data) notFound();

  return <ChatView chatId={chatId} initialMessages={data.messages} />;
}
