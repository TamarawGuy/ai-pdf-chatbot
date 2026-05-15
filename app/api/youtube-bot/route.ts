import { convertToModelMessages, streamText, stepCountIs } from "ai";
import { openai } from "@ai-sdk/openai";
import { auth } from "@clerk/nextjs/server";
import { makeYoutubeTools } from "@/lib/youtube/tools";
import type { YoutubeMessage } from "@/types/youtube-message";
import {
  appendYoutubeMessages,
  getYoutubeChatOwnership,
} from "@/lib/youtube/chats";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return new Response("Unauthorized", { status: 401 });

    const body = await req.json();
    const incoming: YoutubeMessage[] = body.messages ?? [];
    const chatId: string | undefined = body.chatId;

    if (!chatId) {
      return new Response("Missing chatId", { status: 400 });
    }

    const { exists, ownedByCurrentUser, videoId } =
      await getYoutubeChatOwnership(chatId);
    if (!exists) return new Response("Not found", { status: 404 });
    if (!ownedByCurrentUser) return new Response("Forbidden", { status: 403 });
    if (!videoId) return new Response("Chat has no video", { status: 400 });

    const lastMessage = incoming[incoming.length - 1];
    if (lastMessage?.role === "user") {
      await appendYoutubeMessages(chatId, [
        { id: lastMessage.id, role: "user", parts: lastMessage.parts },
      ]);
    }

    const result = streamText({
      model: openai("gpt-4.1-mini"),
      messages: await convertToModelMessages(incoming),
      tools: makeYoutubeTools(videoId),
      system: `You are an assistant that answers questions about a specific YouTube video.
Use the searchVideoTranscript tool to find relevant passages from the transcript before answering.
Base your answers on the transcript. Be concise and do not flood the user with all the search results.`,
      stopWhen: stepCountIs(2),
    });

    result.consumeStream();

    return result.toUIMessageStreamResponse<YoutubeMessage>({
      originalMessages: incoming,
      generateMessageId: () => crypto.randomUUID(),
      onFinish: async ({ responseMessage }) => {
        await appendYoutubeMessages(chatId, [
          {
            id: responseMessage.id,
            role: responseMessage.role,
            parts: responseMessage.parts,
          },
        ]);
      },
    });
  } catch (err) {
    console.error("Error streaming youtube-bot message: ", err);
    return new Response("Failed to stream message", { status: 500 });
  }
}
