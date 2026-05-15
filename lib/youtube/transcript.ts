import "server-only";
import { fetchTranscript } from "youtube-transcript";

const VIDEO_ID_RE =
  /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|v\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/;

export function extractVideoId(input: string): string | null {
  const trimmed = input.trim();
  if (/^[A-Za-z0-9_-]{11}$/.test(trimmed)) return trimmed;
  const match = trimmed.match(VIDEO_ID_RE);
  return match ? match[1] : null;
}

export async function fetchVideoTitle(videoId: string): Promise<string> {
  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
    const res = await fetch(oembedUrl);
    if (!res.ok) return "YouTube video";
    const data = (await res.json()) as { title?: string };
    return data.title?.slice(0, 60) || "YouTube video";
  } catch {
    return "YouTube video";
  }
}

export async function fetchTranscriptText(videoId: string): Promise<string> {
  const data = await fetchTranscript(videoId);
  return data.map((item) => item.text).join(" ");
}
