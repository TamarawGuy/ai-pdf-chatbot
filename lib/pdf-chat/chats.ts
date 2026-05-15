import "server-only";
import { auth } from "@clerk/nextjs/server";
import { and, asc, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db/config";
import { chats, messages } from "@/lib/db/schema";
import type { ChatMessage } from "@/types/chat-message";

async function requireUserId() {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }
  return userId;
}

export async function listChats() {
  const userId = await requireUserId();
  return db
    .select({
      id: chats.id,
      title: chats.title,
      updatedAt: chats.updatedAt,
    })
    .from(chats)
    .where(eq(chats.userId, userId))
    .orderBy(desc(chats.updatedAt));
}

export async function getChat(chatId: string) {
  const userId = await requireUserId();

  const [chat] = await db
    .select()
    .from(chats)
    .where(and(eq(chats.id, chatId), eq(chats.userId, userId)))
    .limit(1);

  if (!chat) return null;

  const rows = await db
    .select()
    .from(messages)
    .where(eq(messages.chatId, chatId))
    .orderBy(asc(messages.createdAt));

  const uiMessages: ChatMessage[] = rows.map((row) => ({
    id: row.id,
    role: row.role as ChatMessage["role"],
    parts: row.parts as ChatMessage["parts"],
  }));

  return { chat, messages: uiMessages };
}

export async function getChatOwnership(chatId: string) {
  const userId = await requireUserId();
  const [chat] = await db
    .select({ id: chats.id, userId: chats.userId })
    .from(chats)
    .where(eq(chats.id, chatId))
    .limit(1);
  return {
    exists: !!chat,
    ownedByCurrentUser: chat?.userId === userId,
    userId,
  };
}

export async function createChatRow(opts: { id?: string; userId: string }) {
  const [row] = await db
    .insert(chats)
    .values({
      ...(opts.id ? { id: opts.id } : {}),
      userId: opts.userId,
    })
    .returning({ id: chats.id });
  return row.id;
}

export async function appendMessages(
  chatId: string,
  toInsert: Array<{
    id: string;
    role: ChatMessage["role"];
    parts: ChatMessage["parts"];
  }>,
) {
  if (toInsert.length === 0) return;
  await db
    .insert(messages)
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
    .update(chats)
    .set({ updatedAt: new Date() })
    .where(eq(chats.id, chatId));
}

export async function countMessages(chatId: string) {
  const rows = await db
    .select({ id: messages.id })
    .from(messages)
    .where(eq(messages.chatId, chatId));
  return rows.length;
}

export async function renameChat(chatId: string, title: string) {
  const userId = await requireUserId();
  const trimmed = title.trim().slice(0, 60);
  if (!trimmed) throw new Error("Title cannot be empty");

  await db
    .update(chats)
    .set({ title: trimmed, updatedAt: new Date() })
    .where(and(eq(chats.id, chatId), eq(chats.userId, userId)));
}

export async function setChatTitle(chatId: string, title: string) {
  const trimmed = title.trim().slice(0, 60);
  if (!trimmed) return;
  await db.update(chats).set({ title: trimmed }).where(eq(chats.id, chatId));
}

export async function deleteChat(chatId: string) {
  const userId = await requireUserId();
  await db
    .delete(chats)
    .where(and(eq(chats.id, chatId), eq(chats.userId, userId)));
}
