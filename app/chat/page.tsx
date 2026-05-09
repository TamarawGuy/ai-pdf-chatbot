"use client";

import { useChat } from "@ai-sdk/react";
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
import { DefaultChatTransport } from "ai";

export default function ChatPage() {
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
    }),
  });

  const handleSubmit = (message: { text: string }) => {
    sendMessage({ text: message.text });
  };

  return (
    <div className="h-screen flex flex-col">
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
