import { and, cosineDistance, desc, eq, gt, sql } from "drizzle-orm";
import { db } from "@/lib/db-config";
import { youtubeChunks } from "@/lib/db-schema";
import { generateEmbedding } from "@/lib/embeddings";

export async function searchYoutubeChunks(
  videoId: string,
  query: string,
  limit: number = 5,
  threshold: number = 0,
) {
  const embedding = await generateEmbedding(query);
  const similarity = sql<number>`1 - (${cosineDistance(youtubeChunks.embedding, embedding)})`;

  return db
    .select({
      id: youtubeChunks.id,
      content: youtubeChunks.content,
      similarity,
    })
    .from(youtubeChunks)
    .where(and(eq(youtubeChunks.videoId, videoId), gt(similarity, threshold)))
    .orderBy(desc(similarity))
    .limit(limit);
}
