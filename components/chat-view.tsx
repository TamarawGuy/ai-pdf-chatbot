"use client";

import { useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
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
import type { ChatMessage } from "@/types/chat-message";

type ChatViewProps = {
  chatId: string;
  initialMessages?: ChatMessage[];
  isNew?: boolean;
};

export default function ChatView({
  chatId,
  initialMessages,
  isNew = false,
}: ChatViewProps) {
  const router = useRouter();
  const didReplaceUrl = useRef(false);

  const transport = useMemo(
    () =>
      new DefaultChatTransport<ChatMessage>({
        api: "/api/chat",
        body: { chatId },
      }),
    [chatId],
  );

  const { messages, sendMessage, status } = useChat<ChatMessage>({
    id: chatId,
    messages: initialMessages,
    transport,
    onFinish: () => {
      if (isNew && !didReplaceUrl.current) {
        didReplaceUrl.current = true;
        window.history.replaceState(null, "", `/chat/${chatId}`);
        router.refresh();
      }
    },
  });

  useEffect(() => {
    didReplaceUrl.current = false;
  }, [chatId]);

  const handleSubmit = (message: { text: string }) => {
    sendMessage({ text: message.text });
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col">
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
              <PromptInputTextarea placeholder="Type a message..." />
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
