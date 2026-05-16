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

export type VideoMetadata = {
  title: string;
  authorName: string | null;
  thumbnailUrl: string | null;
};

export async function fetchVideoMetadata(
  videoId: string,
): Promise<VideoMetadata> {
  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
    const res = await fetch(oembedUrl);
    if (!res.ok) {
      return { title: "YouTube video", authorName: null, thumbnailUrl: null };
    }
    const data = (await res.json()) as {
      title?: string;
      author_name?: string;
      thumbnail_url?: string;
    };
    return {
      title: data.title?.slice(0, 60) || "YouTube video",
      authorName: data.author_name ?? null,
      thumbnailUrl: data.thumbnail_url ?? null,
    };
  } catch {
    return { title: "YouTube video", authorName: null, thumbnailUrl: null };
  }
}

export type VideoTranscript = {
  text: string;
  durationMs: number | null;
};

export async function fetchVideoTranscript(
  videoId: string,
): Promise<VideoTranscript> {
  const data = await fetchTranscript(videoId);
  const text = data.map((item) => item.text).join(" ");

  // youtube-transcript returns offset/duration in ms via the srv3 path
  // (parseInt) and in seconds via the classic XML fallback (parseFloat).
  // Typical segments are 2–8 seconds or 2000–8000 ms, so the magnitude of
  // the last segment's duration is a reliable discriminator.
  const last = data[data.length - 1];
  let durationMs: number | null = null;
  if (last) {
    const rawEnd = last.offset + last.duration;
    durationMs = last.duration >= 100 ? rawEnd : Math.round(rawEnd * 1000);
  }

  return { text, durationMs };
}
