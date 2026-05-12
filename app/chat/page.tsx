import { randomUUID } from "node:crypto";
import ChatView from "@/components/chat-view";

export default function NewChatPage() {
  const chatId = randomUUID();
  return <ChatView chatId={chatId} isNew />;
}
