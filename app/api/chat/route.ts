import { convertToModelMessages, streamText, stepCountIs } from "ai";
import { openai } from "@ai-sdk/openai";
import { auth } from "@clerk/nextjs/server";
import { chatTools } from "@/lib/chat-tools";
import type { ChatMessage } from "@/types/chat-message";
import {
  appendMessages,
  countMessages,
  createChatRow,
  getChatOwnership,
  setChatTitle,
} from "@/lib/chats";
import { generateTitle } from "@/lib/generate-title";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return new Response("Unauthorized", { status: 401 });

    const body = await req.json();
    const incoming: ChatMessage[] = body.messages ?? [];
    const requestedChatId: string | undefined = body.chatId;

    let chatId: string;
    let isFirstExchange: boolean;

    if (requestedChatId) {
      const { exists, ownedByCurrentUser } =
        await getChatOwnership(requestedChatId);
      if (exists && !ownedByCurrentUser) {
        return new Response("Forbidden", { status: 403 });
      }
      if (!exists) {
        await createChatRow({ id: requestedChatId, userId });
        isFirstExchange = true;
      } else {
        isFirstExchange = (await countMessages(requestedChatId)) === 0;
      }
      chatId = requestedChatId;
    } else {
      chatId = await createChatRow({ userId });
      isFirstExchange = true;
    }

    const lastMessage = incoming[incoming.length - 1];
    if (lastMessage?.role === "user") {
      await appendMessages(chatId, [
        { id: lastMessage.id, role: "user", parts: lastMessage.parts },
      ]);
    }

    if (isFirstExchange && lastMessage?.role === "user") {
      const userText = lastMessage.parts
        .filter((p) => p.type === "text")
        .map((p) => (p as { text: string }).text)
        .join(" ")
        .trim();
      if (userText) {
        const title = await generateTitle(userText);
        await setChatTitle(chatId, title);
      }
    }

    const result = streamText({
      model: openai("gpt-4.1-mini"),
      messages: await convertToModelMessages(incoming),
      tools: chatTools,
      system: `You are a helpful assistant with access to a knowledge base.
When users ask questions, search the knowledge base for relevant information.
Always search before answering if the question might relate to uploaded documents.
Base your answers on the search results when available. Give concise answers that correctly answer what the user is asking for. Do not flood them with all the information from the search results.`,
      stopWhen: stepCountIs(2),
    });

    result.consumeStream();

    return result.toUIMessageStreamResponse<ChatMessage>({
      originalMessages: incoming,
      generateMessageId: () => crypto.randomUUID(),
      headers: { "x-chat-id": chatId },
      onFinish: async ({ responseMessage }) => {
        await appendMessages(chatId, [
          {
            id: responseMessage.id,
            role: responseMessage.role,
            parts: responseMessage.parts,
          },
        ]);
      },
    });
  } catch (err) {
    console.error("Error streaming message: ", err);
    return new Response("Failed to stream message", { status: 500 });
  }
}
