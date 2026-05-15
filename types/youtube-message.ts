import type { UIMessage, UIDataTypes, InferUITools } from "ai";
import type { youtubeTools } from "@/lib/youtube/tools";

export type YoutubeTools = InferUITools<typeof youtubeTools>;
export type YoutubeMessage = UIMessage<never, UIDataTypes, YoutubeTools>;
