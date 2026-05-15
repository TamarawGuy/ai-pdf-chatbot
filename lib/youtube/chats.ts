import "server-only";
import { auth } from "@clerk/nextjs/server";
import { and, asc, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db/config";
import { youtubeChats, youtubeMessages, youtubeVideos } from "@/lib/db/schema";
import type { YoutubeMessage } from "@/types/youtube-message";

async function requireUserId() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  return userId;
}

export async function listYoutubeChats() {
  const userId = await requireUserId();
  return db
    .select({
      id: youtubeChats.id,
      title: youtubeChats.title,
      updatedAt: youtubeChats.updatedAt,
      videoId: youtubeChats.videoId,
    })
    .from(youtubeChats)
    .where(eq(youtubeChats.userId, userId))
    .orderBy(desc(youtubeChats.updatedAt));
}

export async function getYoutubeChat(chatId: string) {
  const userId = await requireUserId();

  const [row] = await db
    .select({
      chat: youtubeChats,
      video: youtubeVideos,
    })
    .from(youtubeChats)
    .innerJoin(youtubeVideos, eq(youtubeChats.videoId, youtubeVideos.id))
    .where(and(eq(youtubeChats.id, chatId), eq(youtubeChats.userId, userId)))
    .limit(1);

  if (!row) return null;

  const rows = await db
    .select()
    .from(youtubeMessages)
    .where(eq(youtubeMessages.chatId, chatId))
    .orderBy(asc(youtubeMessages.createdAt));

  const uiMessages: YoutubeMessage[] = rows.map((row) => ({
    id: row.id,
    role: row.role as YoutubeMessage["role"],
    parts: row.parts as YoutubeMessage["parts"],
  }));

  return { chat: row.chat, video: row.video, messages: uiMessages };
}

export async function getYoutubeChatOwnership(chatId: string) {
  const userId = await requireUserId();
  const [chat] = await db
    .select({
      id: youtubeChats.id,
      userId: youtubeChats.userId,
      videoId: youtubeChats.videoId,
    })
    .from(youtubeChats)
    .where(eq(youtubeChats.id, chatId))
    .limit(1);
  return {
    exists: !!chat,
    ownedByCurrentUser: chat?.userId === userId,
    videoId: chat?.videoId,
    userId,
  };
}

export async function createYoutubeChatRow(opts: {
  id?: string;
  userId: string;
  videoId: string;
  title: string;
}) {
  const trimmed = opts.title.trim().slice(0, 60) || "New chat";
  const [row] = await db
    .insert(youtubeChats)
    .values({
      ...(opts.id ? { id: opts.id } : {}),
      userId: opts.userId,
      videoId: opts.videoId,
      title: trimmed,
    })
    .returning({ id: youtubeChats.id });
  return row.id;
}

export async function appendYoutubeMessages(
  chatId: string,
  toInsert: Array<{
    id: string;
    role: YoutubeMessage["role"];
    parts: YoutubeMessage["parts"];
  }>,
) {
  if (toInsert.length === 0) return;
  await db
    .insert(youtubeMessages)
    .values(
      toInsert.map((m) => ({
        id: m.id,
        chatId,
        role: m.role,
        parts: m.parts,
      })),
    )
    .onConflictDoNothing();
  await db
    .update(youtubeChats)
    .set({ updatedAt: new Date() })
    .where(eq(youtubeChats.id, chatId));
}

export async function countYoutubeMessages(chatId: string) {
  const rows = await db
    .select({ id: youtubeMessages.id })
    .from(youtubeMessages)
    .where(eq(youtubeMessages.chatId, chatId));
  return rows.length;
}

export async function renameYoutubeChat(chatId: string, title: string) {
  const userId = await requireUserId();
  const trimmed = title.trim().slice(0, 60);
  if (!trimmed) throw new Error("Title cannot be empty");

  await db
    .update(youtubeChats)
    .set({ title: trimmed, updatedAt: new Date() })
    .where(and(eq(youtubeChats.id, chatId), eq(youtubeChats.userId, userId)));
}

export async function deleteYoutubeChat(chatId: string) {
  const userId = await requireUserId();
  await db
    .delete(youtubeChats)
    .where(and(eq(youtubeChats.id, chatId), eq(youtubeChats.userId, userId)));
}
