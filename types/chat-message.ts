import type { UIMessage, UIDataTypes, InferUITools } from "ai";
import type { chatTools } from "@/lib/pdf-chat/tools";

export type ChatTools = InferUITools<typeof chatTools>;
export type ChatMessage = UIMessage<never, UIDataTypes, ChatTools>;
