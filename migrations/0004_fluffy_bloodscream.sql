CREATE TABLE "youtube_chats" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"video_id" uuid NOT NULL,
	"title" text DEFAULT 'New chat' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "youtube_chunks" (
	"id" serial PRIMARY KEY NOT NULL,
	"video_id" uuid NOT NULL,
	"content" text NOT NULL,
	"embedding" vector(1536)
);
--> statement-breakpoint
CREATE TABLE "youtube_messages" (
	"id" text PRIMARY KEY NOT NULL,
	"chat_id" uuid NOT NULL,
	"role" text NOT NULL,
	"parts" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "youtube_videos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"youtube_video_id" text NOT NULL,
	"url" text NOT NULL,
	"title" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "youtube_chats" ADD CONSTRAINT "youtube_chats_video_id_youtube_videos_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."youtube_videos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "youtube_chunks" ADD CONSTRAINT "youtube_chunks_video_id_youtube_videos_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."youtube_videos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "youtube_messages" ADD CONSTRAINT "youtube_messages_chat_id_youtube_chats_id_fk" FOREIGN KEY ("chat_id") REFERENCES "public"."youtube_chats"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "youtube_chats_user_updated_idx" ON "youtube_chats" USING btree ("user_id","updated_at");--> statement-breakpoint
CREATE INDEX "youtube_chunks_video_idx" ON "youtube_chunks" USING btree ("video_id");--> statement-breakpoint
CREATE INDEX "youtube_chunks_embedding_idx" ON "youtube_chunks" USING hnsw ("embedding" vector_cosine_ops);--> statement-breakpoint
CREATE INDEX "youtube_messages_chat_created_idx" ON "youtube_messages" USING btree ("chat_id","created_at");--> statement-breakpoint
CREATE INDEX "youtube_videos_user_video_idx" ON "youtube_videos" USING btree ("user_id","youtube_video_id");