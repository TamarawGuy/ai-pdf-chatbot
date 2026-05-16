"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import {
  createChatRow,
  deleteChat,
  renameChat,
} from "@/lib/pdf-chat/chats";
import { loadPdfDocument } from "@/lib/pdf-chat/documents";

export async function loadPdfAction(
  _prevState: { error: string | null } | null,
  formData: FormData,
): Promise<{ error: string | null }> {
  const file = formData.get("pdf");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Please choose a PDF file" };
  }

  const { userId } = await auth();
  if (!userId) {
    return { error: "You must be signed in" };
  }

  let document;
  try {
    document = await loadPdfDocument({ userId, file });
  } catch (err) {
    console.error("Failed to load PDF:", err);
    const message =
      err instanceof Error ? err.message : "Failed to process PDF";
    return { error: message };
  }

  const chatId = await createChatRow({
    userId,
    documentId: document.documentId,
    title: document.filename,
  });

  revalidatePath("/chat", "layout");
  redirect(`/chat/${chatId}`);
}

export async function renameChatAction(chatId: string, title: string) {
  await renameChat(chatId, title);
  revalidatePath("/chat", "layout");
}

export async function deleteChatAction(chatId: string) {
  await deleteChat(chatId);
  revalidatePath("/chat", "layout");
}
