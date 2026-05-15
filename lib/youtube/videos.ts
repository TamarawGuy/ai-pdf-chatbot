import "server-only";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db/config";
import { youtubeVideos, youtubeChunks } from "@/lib/db/schema";
import { chunkContent } from "@/lib/ai/chunking";
import { generateEmbeddings } from "@/lib/ai/embeddings";
import {
  extractVideoId,
  fetchTranscriptText,
  fetchVideoTitle,
} from "@/lib/youtube/transcript";

export type LoadedVideo = {
  videoId: string;
  title: string;
  cached: boolean;
};

export async function loadOrCreateVideo(opts: {
  userId: string;
  url: string;
}): Promise<LoadedVideo> {
  const youtubeVideoId = extractVideoId(opts.url);
  if (!youtubeVideoId) {
    throw new Error("Invalid YouTube URL");
  }

  const [existing] = await db
    .select({ id: youtubeVideos.id, title: youtubeVideos.title })
    .from(youtubeVideos)
    .where(
      and(
        eq(youtubeVideos.userId, opts.userId),
        eq(youtubeVideos.youtubeVideoId, youtubeVideoId),
      ),
    )
    .limit(1);

  if (existing) {
    return { videoId: existing.id, title: existing.title, cached: true };
  }

  const [transcript, title] = await Promise.all([
    fetchTranscriptText(youtubeVideoId),
    fetchVideoTitle(youtubeVideoId),
  ]);

  if (!transcript.trim()) {
    throw new Error("No transcript found for this video");
  }

  const [video] = await db
    .insert(youtubeVideos)
    .values({
      userId: opts.userId,
      youtubeVideoId,
      url: `https://www.youtube.com/watch?v=${youtubeVideoId}`,
      title,
    })
    .returning({ id: youtubeVideos.id });

  const chunks = await chunkContent(transcript);
  const embeddings = await generateEmbeddings(chunks);

  await db.insert(youtubeChunks).values(
    chunks.map((content, i) => ({
      videoId: video.id,
      content,
      embedding: embeddings[i],
    })),
  );

  return { videoId: video.id, title, cached: false };
}
