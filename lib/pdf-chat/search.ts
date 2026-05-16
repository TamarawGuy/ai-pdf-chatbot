import { and, cosineDistance, desc, eq, gt, sql } from "drizzle-orm";
import { db } from "../db/config";
import { pdfChunks } from "../db/schema";
import { generateEmbedding } from "../ai/embeddings";

export async function searchPdfChunks(
  documentId: string,
  query: string,
  limit: number = 5,
  threshold: number = 0,
) {
  const embedding = await generateEmbedding(query);
  const similarity = sql<number>`1 - (${cosineDistance(pdfChunks.embedding, embedding)})`;

  return db
    .select({
      id: pdfChunks.id,
      content: pdfChunks.content,
      similarity,
    })
    .from(pdfChunks)
    .where(and(eq(pdfChunks.documentId, documentId), gt(similarity, threshold)))
    .orderBy(desc(similarity))
    .limit(limit);
}
