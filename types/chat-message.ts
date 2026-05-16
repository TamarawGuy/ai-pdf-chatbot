import type { UIMessage, UIDataTypes, InferUITools } from "ai";
import type { pdfChatTools } from "@/lib/pdf-chat/tools";

export type ChatTools = InferUITools<typeof pdfChatTools>;
export type ChatMessage = UIMessage<never, UIDataTypes, ChatTools>;
