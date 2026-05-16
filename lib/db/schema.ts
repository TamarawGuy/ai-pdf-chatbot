import {
  pgTable,
  serial,
  text,
  vector,
  index,
  uuid,
  timestamp,
  jsonb,
  integer,
} from "drizzle-orm/pg-core";
import type { UIMessagePart, UIDataTypes } from "ai";
import type { ChatTools } from "@/types/chat-message";
import type { YoutubeTools } from "@/types/youtube-message";

export const pdfDocuments = pgTable(
  "pdf_documents",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").notNull(),
    filename: text("filename").notNull(),
    fullText: text("full_text").notNull(),
    tokenCount: integer("token_count").notNull(),
    summary: text("summary"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("pdf_documents_user_created_idx").on(table.userId, table.createdAt),
  ],
);

export const pdfChunks = pgTable(
  "pdf_chunks",
  {
    id: serial("id").primaryKey(),
    documentId: uuid("document_id")
      .notNull()
      .references(() => pdfDocuments.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    embedding: vector("embedding", { dimensions: 1536 }),
  },
  (table) => [
    index("pdf_chunks_document_idx").on(table.documentId),
    index("pdf_chunks_embedding_idx").using(
      "hnsw",
      table.embedding.op("vector_cosine_ops"),
    ),
  ],
);

export const chats = pgTable(
  "chats",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").notNull(),
    documentId: uuid("document_id")
      .notNull()
      .references(() => pdfDocuments.id, { onDelete: "cascade" }),
    title: text("title").notNull().default("New chat"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("chats_user_updated_idx").on(table.userId, table.updatedAt)],
);

export const messages = pgTable(
  "messages",
  {
    id: text("id").primaryKey(),
    chatId: uuid("chat_id")
      .notNull()
      .references(() => chats.id, { onDelete: "cascade" }),
    role: text("role").notNull().$type<"user" | "assistant" | "system" | "tool">(),
    parts: jsonb("parts")
      .notNull()
      .$type<UIMessagePart<UIDataTypes, ChatTools>[]>(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("messages_chat_created_idx").on(table.chatId, table.createdAt)],
);

export const youtubeVideos = pgTable(
  "youtube_videos",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").notNull(),
    youtubeVideoId: text("youtube_video_id").notNull(),
    url: text("url").notNull(),
    title: text("title").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("youtube_videos_user_video_idx").on(
      table.userId,
      table.youtubeVideoId,
    ),
  ],
);

export const youtubeChunks = pgTable(
  "youtube_chunks",
  {
    id: serial("id").primaryKey(),
    videoId: uuid("video_id")
      .notNull()
      .references(() => youtubeVideos.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    embedding: vector("embedding", { dimensions: 1536 }),
  },
  (table) => [
    index("youtube_chunks_video_idx").on(table.videoId),
    index("youtube_chunks_embedding_idx").using(
      "hnsw",
      table.embedding.op("vector_cosine_ops"),
    ),
  ],
);

export const youtubeChats = pgTable(
  "youtube_chats",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").notNull(),
    videoId: uuid("video_id")
      .notNull()
      .references(() => youtubeVideos.id, { onDelete: "cascade" }),
    title: text("title").notNull().default("New chat"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("youtube_chats_user_updated_idx").on(table.userId, table.updatedAt),
  ],
);

export const youtubeMessages = pgTable(
  "youtube_messages",
  {
    id: text("id").primaryKey(),
    chatId: uuid("chat_id")
      .notNull()
      .references(() => youtubeChats.id, { onDelete: "cascade" }),
    role: text("role")
      .notNull()
      .$type<"user" | "assistant" | "system" | "tool">(),
    parts: jsonb("parts")
      .notNull()
      .$type<UIMessagePart<UIDataTypes, YoutubeTools>[]>(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("youtube_messages_chat_created_idx").on(
      table.chatId,
      table.createdAt,
    ),
  ],
);

export type InsertPdfDocument = typeof pdfDocuments.$inferInsert;
export type SelectPdfDocument = typeof pdfDocuments.$inferSelect;
export type InsertPdfChunk = typeof pdfChunks.$inferInsert;
export type SelectPdfChunk = typeof pdfChunks.$inferSelect;
export type InsertChat = typeof chats.$inferInsert;
export type SelectChat = typeof chats.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;
export type SelectMessage = typeof messages.$inferSelect;
export type InsertYoutubeVideo = typeof youtubeVideos.$inferInsert;
export type SelectYoutubeVideo = typeof youtubeVideos.$inferSelect;
export type InsertYoutubeChunk = typeof youtubeChunks.$inferInsert;
export type SelectYoutubeChunk = typeof youtubeChunks.$inferSelect;
export type InsertYoutubeChat = typeof youtubeChats.$inferInsert;
export type SelectYoutubeChat = typeof youtubeChats.$inferSelect;
export type InsertYoutubeMessage = typeof youtubeMessages.$inferInsert;
export type SelectYoutubeMessage = typeof youtubeMessages.$inferSelect;
