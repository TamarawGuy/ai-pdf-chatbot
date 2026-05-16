"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputBody,
  PromptInputFooter,
  PromptInputProvider,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@/components/ai-elements/prompt-input";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { VideoCard } from "@/components/video-card";

import type { YoutubeMessage } from "@/types/youtube-message";

type YoutubeBotViewProps = {
  chatId: string;
  videoTitle: string;
  videoUrl: string;
  authorName: string | null;
  thumbnailUrl: string | null;
  durationMs: number | null;
  initialMessages?: YoutubeMessage[];
};

const CHIPS = [
  "Summarize in 5 bullets",
  "Cite the key timestamps",
  "Explain like I'm new to this",
];

export default function YoutubeBotView({
  chatId,
  videoTitle,
  videoUrl,
  authorName,
  thumbnailUrl,
  durationMs,
  initialMessages,
}: YoutubeBotViewProps) {
  const transport = useMemo(
    () =>
      new DefaultChatTransport<YoutubeMessage>({
        api: "/api/youtube-bot",
        body: { chatId },
      }),
    [chatId],
  );

  const { messages, sendMessage, status } = useChat<YoutubeMessage>({
    id: chatId,
    messages: initialMessages,
    transport,
  });

  const handleSubmit = (message: { text: string }) => {
    sendMessage({ text: message.text });
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col">
      <div className="flex items-center gap-3 border-b px-3 h-12 shrink-0">
        <SidebarTrigger />
        <span className="text-sm font-medium truncate flex-1">
          YouTube Chat
          <span className="text-muted-foreground"> · {videoTitle}</span>
        </span>
        <Button asChild variant="ghost" size="sm">
          <Link href="/youtube-bot">
            <Plus className="size-4" />
            New video
          </Link>
        </Button>
      </div>

      <Conversation className="flex-1">
        <ConversationContent>
          <VideoCard
            title={videoTitle}
            authorName={authorName}
            durationMs={durationMs}
            thumbnailUrl={thumbnailUrl}
            url={videoUrl}
          />
          {messages.map((message) => (
            <Message key={message.id} from={message.role}>
              <MessageContent>
                {message.parts.map((part, i) =>
                  part.type === "text" ? (
                    <MessageResponse key={i}>{part.text}</MessageResponse>
                  ) : null,
                )}
              </MessageContent>
            </Message>
          ))}
          <ConversationScrollButton />
        </ConversationContent>
      </Conversation>

      <div className="w-full max-w-[800px] mx-auto px-4 pb-4">
        <div className="flex flex-wrap items-center gap-2 px-1 pb-2">
          <span className="text-xs text-muted-foreground">Tip</span>
          {CHIPS.map((chip) => (
            <button
              key={chip}
              type="button"
              disabled={status !== "ready"}
              onClick={() => sendMessage({ text: chip })}
              className="text-xs rounded-full border px-3 py-1 hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {chip}
            </button>
          ))}
        </div>
        <PromptInputProvider>
          <PromptInput onSubmit={handleSubmit} className="p-4">
            <PromptInputBody>
              <PromptInputTextarea
                placeholder={`Ask about "${videoTitle}"…`}
              />
            </PromptInputBody>
            <PromptInputFooter className="justify-end">
              <PromptInputSubmit status={status} />
            </PromptInputFooter>
          </PromptInput>
        </PromptInputProvider>
      </div>
    </div>
  );
}
