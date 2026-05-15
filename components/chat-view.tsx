"use client";

import { useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { FileText } from "lucide-react";
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
import UploadPdfDialog from "@/components/upload-pdf-dialog";
import type { ChatMessage } from "@/types/chat-message";

type ChatViewProps = {
  chatId: string;
  initialMessages?: ChatMessage[];
  isNew?: boolean;
  chatTitle?: string;
};

const SUGGESTIONS: { title: string; description: string }[] = [
  {
    title: "Summarize this document",
    description: "Get the gist in 5 bullets",
  },
  {
    title: "What are the key findings?",
    description: "Pull out conclusions and data",
  },
  {
    title: "Explain like I'm new to this",
    description: "Plain-language breakdown",
  },
  {
    title: "Draft a follow-up email",
    description: "Based on what the doc says",
  },
];

function EmptyState({
  onPickSuggestion,
}: {
  onPickSuggestion: (text: string) => void;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 px-4">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-linear-to-br from-blue-500 to-violet-500 text-white shadow-[0_8px_30px_rgba(59,130,246,0.35)]">
        <FileText className="h-6 w-6" />
      </span>
      <div className="flex flex-col items-center gap-2">
        <h1 className="text-center text-2xl font-semibold tracking-tight sm:text-3xl">
          Ask anything about{" "}
          <span className="font-serif font-normal italic text-blue-600">
            your PDF
          </span>
        </h1>
        <p className="max-w-md text-center text-sm text-muted-foreground">
          Upload a document, or start with one of these to see how it works.
        </p>
      </div>
      <div className="grid w-full max-w-2xl grid-cols-1 gap-3 sm:grid-cols-2">
        {SUGGESTIONS.map((item) => (
          <button
            key={item.title}
            type="button"
            onClick={() => onPickSuggestion(item.title)}
            className="flex flex-col items-start gap-0.5 rounded-xl border bg-white px-4 py-3 text-left transition-colors hover:bg-muted/40"
          >
            <span className="text-sm font-medium">{item.title}</span>
            <span className="text-xs text-muted-foreground">
              {item.description}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function ChatView({
  chatId,
  initialMessages,
  isNew = false,
  chatTitle,
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
      <div className="flex items-center gap-3 border-b px-3 h-12 shrink-0">
        <SidebarTrigger />
        <span className="text-sm font-medium">
          PDF Chat
          {chatTitle ? (
            <span className="text-muted-foreground"> · {chatTitle}</span>
          ) : null}
        </span>
        <div className="ml-auto">
          <UploadPdfDialog />
        </div>
      </div>

      {messages.length === 0 ? (
        <EmptyState onPickSuggestion={(text) => sendMessage({ text })} />
      ) : (
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
      )}

      <div className="w-full max-w-[760px] mx-auto px-4 pb-4">
        <PromptInputProvider>
          <PromptInput onSubmit={handleSubmit} className="p-4">
            <PromptInputBody>
              <PromptInputTextarea placeholder="Ask anything about your PDF..." />
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
