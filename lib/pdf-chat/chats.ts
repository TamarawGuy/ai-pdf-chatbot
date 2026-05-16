import "server-only";
import { auth } from "@clerk/nextjs/server";
import { and, asc, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db/config";
import { chats, messages, pdfDocuments } from "@/lib/db/schema";
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
      documentId: chats.documentId,
    })
    .from(chats)
    .where(eq(chats.userId, userId))
    .orderBy(desc(chats.updatedAt));
}

export async function getChat(chatId: string) {
  const userId = await requireUserId();

  const [row] = await db
    .select({
      chat: chats,
      document: pdfDocuments,
    })
    .from(chats)
    .innerJoin(pdfDocuments, eq(chats.documentId, pdfDocuments.id))
    .where(and(eq(chats.id, chatId), eq(chats.userId, userId)))
    .limit(1);

  if (!row) return null;

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

  return { chat: row.chat, document: row.document, messages: uiMessages };
}

export async function getChatOwnership(chatId: string) {
  const userId = await requireUserId();
  const [chat] = await db
    .select({
      id: chats.id,
      userId: chats.userId,
      documentId: chats.documentId,
    })
    .from(chats)
    .where(eq(chats.id, chatId))
    .limit(1);
  return {
    exists: !!chat,
    ownedByCurrentUser: chat?.userId === userId,
    documentId: chat?.documentId,
    userId,
  };
}

export async function getChatWithDocument(chatId: string) {
  const userId = await requireUserId();
  const [row] = await db
    .select({
      chatUserId: chats.userId,
      documentId: pdfDocuments.id,
      filename: pdfDocuments.filename,
      fullText: pdfDocuments.fullText,
      tokenCount: pdfDocuments.tokenCount,
      summary: pdfDocuments.summary,
    })
    .from(chats)
    .innerJoin(pdfDocuments, eq(chats.documentId, pdfDocuments.id))
    .where(eq(chats.id, chatId))
    .limit(1);
  if (!row) {
    return { exists: false as const, ownedByCurrentUser: false, userId };
  }
  return {
    exists: true as const,
    ownedByCurrentUser: row.chatUserId === userId,
    userId,
    document: {
      id: row.documentId,
      filename: row.filename,
      fullText: row.fullText,
      tokenCount: row.tokenCount,
      summary: row.summary,
    },
  };
}

export async function createChatRow(opts: {
  id?: string;
  userId: string;
  documentId: string;
  title: string;
}) {
  const trimmed = opts.title.trim().slice(0, 60) || "New chat";
  const [row] = await db
    .insert(chats)
    .values({
      ...(opts.id ? { id: opts.id } : {}),
      userId: opts.userId,
      documentId: opts.documentId,
      title: trimmed,
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

export async function renameChat(chatId: string, title: string) {
  const userId = await requireUserId();
  const trimmed = title.trim().slice(0, 60);
  if (!trimmed) throw new Error("Title cannot be empty");

  await db
    .update(chats)
    .set({ title: trimmed, updatedAt: new Date() })
    .where(and(eq(chats.id, chatId), eq(chats.userId, userId)));
}

export async function deleteChat(chatId: string) {
  const userId = await requireUserId();
  await db
    .delete(chats)
    .where(and(eq(chats.id, chatId), eq(chats.userId, userId)));
}
