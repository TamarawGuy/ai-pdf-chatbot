DELETE FROM "messages";--> statement-breakpoint
DELETE FROM "chats";--> statement-breakpoint
DELETE FROM "pdf_chunks";--> statement-breakpoint
DELETE FROM "pdf_documents";--> statement-breakpoint
ALTER TABLE "pdf_documents" ADD COLUMN "full_text" text NOT NULL;--> statement-breakpoint
ALTER TABLE "pdf_documents" ADD COLUMN "token_count" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "pdf_documents" ADD COLUMN "summary" text;