CREATE TABLE "pdf_chunks" (
	"id" serial PRIMARY KEY NOT NULL,
	"document_id" uuid NOT NULL,
	"content" text NOT NULL,
	"embedding" vector(1536)
);
--> statement-breakpoint
CREATE TABLE "pdf_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"filename" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "documents" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "documents" CASCADE;--> statement-breakpoint
DELETE FROM "messages";--> statement-breakpoint
DELETE FROM "chats";--> statement-breakpoint
ALTER TABLE "chats" ADD COLUMN "document_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "pdf_chunks" ADD CONSTRAINT "pdf_chunks_document_id_pdf_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."pdf_documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "pdf_chunks_document_idx" ON "pdf_chunks" USING btree ("document_id");--> statement-breakpoint
CREATE INDEX "pdf_chunks_embedding_idx" ON "pdf_chunks" USING hnsw ("embedding" vector_cosine_ops);--> statement-breakpoint
CREATE INDEX "pdf_documents_user_created_idx" ON "pdf_documents" USING btree ("user_id","created_at");--> statement-breakpoint
ALTER TABLE "chats" ADD CONSTRAINT "chats_document_id_pdf_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."pdf_documents"("id") ON DELETE cascade ON UPDATE no action;