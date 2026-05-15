import { notFound } from "next/navigation";
import YoutubeBotView from "@/components/youtube-bot-view";
import { getYoutubeChat } from "@/lib/youtube/chats";

export default async function ExistingYoutubeBotPage({
  params,
}: {
  params: Promise<{ chatId: string }>;
}) {
  const { chatId } = await params;
  const data = await getYoutubeChat(chatId);
  if (!data) notFound();

  return (
    <YoutubeBotView
      chatId={chatId}
      videoTitle={data.video.title}
      videoUrl={data.video.url}
      initialMessages={data.messages}
    />
  );
}
