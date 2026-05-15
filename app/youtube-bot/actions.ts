"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import {
  createYoutubeChatRow,
  deleteYoutubeChat,
  renameYoutubeChat,
} from "@/lib/youtube/chats";
import { loadOrCreateVideo } from "@/lib/youtube/videos";

export async function loadYoutubeVideoAction(
  _prevState: { error: string | null } | null,
  formData: FormData,
): Promise<{ error: string | null }> {
  const url = (formData.get("url") as string | null)?.trim();
  if (!url) {
    return { error: "Please enter a YouTube URL" };
  }

  const { userId } = await auth();
  if (!userId) {
    return { error: "You must be signed in" };
  }

  let video;
  try {
    video = await loadOrCreateVideo({ userId, url });
  } catch (err) {
    console.error("Failed to load video:", err);
    const message =
      err instanceof Error ? err.message : "Failed to load YouTube video";
    return { error: message };
  }

  const chatId = await createYoutubeChatRow({
    userId,
    videoId: video.videoId,
    title: video.title,
  });

  revalidatePath("/youtube-bot", "layout");
  redirect(`/youtube-bot/${chatId}`);
}

export async function renameYoutubeChatAction(chatId: string, title: string) {
  await renameYoutubeChat(chatId, title);
  revalidatePath("/youtube-bot", "layout");
}

export async function deleteYoutubeChatAction(chatId: string) {
  await deleteYoutubeChat(chatId);
  revalidatePath("/youtube-bot", "layout");
}
