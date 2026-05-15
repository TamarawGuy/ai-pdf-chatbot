"use client";

import { useMemo } from "react";
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

import type { YoutubeMessage } from "@/types/youtube-message";

type YoutubeBotViewProps = {
  chatId: string;
  videoTitle: string;
  videoUrl: string;
  initialMessages?: YoutubeMessage[];
};

export default function YoutubeBotView({
  chatId,
  videoTitle,
  videoUrl,
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
      <div className="border-b px-4 py-2 shrink-0">
        <a
          href={videoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-medium hover:underline truncate block"
          title={videoTitle}
        >
          {videoTitle}
        </a>
      </div>

      <Conversation className="flex-1">
        <ConversationContent>
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

      <div className="w-full max-w-[800px] mx-auto px-4">
        <PromptInputProvider>
          <PromptInput onSubmit={handleSubmit} className="p-4">
            <PromptInputBody>
              <PromptInputTextarea placeholder="Ask about the video..." />
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
