import type { UIMessage, UIDataTypes, InferUITools } from "ai";
import type { chatTools } from "@/lib/chat-tools";

export type ChatTools = InferUITools<typeof chatTools>;
export type ChatMessage = UIMessage<never, UIDataTypes, ChatTools>;
