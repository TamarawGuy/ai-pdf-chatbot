import { convertToModelMessages, streamText, stepCountIs } from "ai";
import { openai } from "@ai-sdk/openai";
import { auth } from "@clerk/nextjs/server";
import { makePdfChatTools } from "@/lib/pdf-chat/tools";
import type { ChatMessage } from "@/types/chat-message";
import {
  appendMessages,
  getChatWithDocument,
} from "@/lib/pdf-chat/chats";
import { FULL_TEXT_TOKEN_THRESHOLD } from "@/lib/pdf-chat/documents";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return new Response("Unauthorized", { status: 401 });

    const body = await req.json();
    const incoming: ChatMessage[] = body.messages ?? [];
    const chatId: string | undefined = body.chatId;

    if (!chatId) {
      return new Response("Missing chatId", { status: 400 });
    }

    const result = await getChatWithDocument(chatId);
    if (!result.exists) return new Response("Not found", { status: 404 });
    if (!result.ownedByCurrentUser)
      return new Response("Forbidden", { status: 403 });
    const { document } = result;

    const lastMessage = incoming[incoming.length - 1];
    if (lastMessage?.role === "user") {
      await appendMessages(chatId, [
        { id: lastMessage.id, role: "user", parts: lastMessage.parts },
      ]);
    }

    const useFullText = document.tokenCount <= FULL_TEXT_TOKEN_THRESHOLD;

    const system = useFullText
      ? `You are an assistant that answers questions about a specific PDF document.
The full text of the PDF "${document.filename}" is provided below. Use only this text as the source of truth when answering. If the answer is not contained in the document, say so plainly.

<document filename="${document.filename}">
${document.fullText}
</document>

Answer concisely and accurately. When asked to summarize or describe the document, use the full text above directly.`
      : `You are an assistant that answers questions about a specific PDF document.
The PDF "${document.filename}" is too long to include in full, so you have a searchKnowledgeBase tool that returns the most relevant passages for a given query.

Guidelines:
- For broad questions ("summarize", "what is this about"), rely on the summary below and, if needed, search for a few representative topics ("introduction", "conclusion", main themes).
- For specific questions, search with focused keywords from the user's question. If the first search is not useful, try again with a different query.
- Base answers only on the summary or search results. If you can't find an answer, say so plainly.
- Be concise. Do not dump raw search results at the user.

<document_summary filename="${document.filename}">
${document.summary ?? "(no summary available)"}
</document_summary>`;

    const stream = streamText({
      model: openai("gpt-4.1-mini"),
      messages: await convertToModelMessages(incoming),
      ...(useFullText
        ? {}
        : { tools: makePdfChatTools(document.id), stopWhen: stepCountIs(5) }),
      system,
    });

    stream.consumeStream();

    return stream.toUIMessageStreamResponse<ChatMessage>({
      originalMessages: incoming,
      generateMessageId: () => crypto.randomUUID(),
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
