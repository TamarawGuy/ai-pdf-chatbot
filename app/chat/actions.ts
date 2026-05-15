"use server";

import { revalidatePath } from "next/cache";
import { deleteChat, renameChat } from "@/lib/pdf-chat/chats";

export async function renameChatAction(chatId: string, title: string) {
  await renameChat(chatId, title);
  revalidatePath("/chat", "layout");
}

export async function deleteChatAction(chatId: string) {
  await deleteChat(chatId);
  revalidatePath("/chat", "layout");
}
