import "server-only";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db/config";
import { youtubeVideos, youtubeChunks } from "@/lib/db/schema";
import { chunkContent } from "@/lib/ai/chunking";
import { generateEmbeddings } from "@/lib/ai/embeddings";
import {
  extractVideoId,
  fetchVideoMetadata,
  fetchVideoTranscript,
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

  const [transcript, metadata] = await Promise.all([
    fetchVideoTranscript(youtubeVideoId),
    fetchVideoMetadata(youtubeVideoId),
  ]);

  if (!transcript.text.trim()) {
    throw new Error("No transcript found for this video");
  }

  const [video] = await db
    .insert(youtubeVideos)
    .values({
      userId: opts.userId,
      youtubeVideoId,
      url: `https://www.youtube.com/watch?v=${youtubeVideoId}`,
      title: metadata.title,
      authorName: metadata.authorName,
      thumbnailUrl: metadata.thumbnailUrl,
      durationMs: transcript.durationMs,
    })
    .returning({ id: youtubeVideos.id });

  const chunks = await chunkContent(transcript.text);
  const embeddings = await generateEmbeddings(chunks);

  await db.insert(youtubeChunks).values(
    chunks.map((content, i) => ({
      videoId: video.id,
      content,
      embedding: embeddings[i],
    })),
  );

  return { videoId: video.id, title: metadata.title, cached: false };
}
