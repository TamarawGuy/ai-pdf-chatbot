"use client";

import { useState } from "react";
import { MonitorPlay, X } from "lucide-react";

type VideoCardProps = {
  title: string;
  authorName: string | null;
  durationMs: number | null;
  thumbnailUrl: string | null;
  url: string;
};

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  if (hours > 0) return `${hours}:${pad(minutes)}:${pad(seconds)}`;
  return `${minutes}:${pad(seconds)}`;
}

export function VideoCard({
  title,
  authorName,
  durationMs,
  thumbnailUrl,
  url,
}: VideoCardProps) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  const subtitleParts = [
    authorName,
    durationMs != null ? formatDuration(durationMs) : null,
  ].filter(Boolean);

  return (
    <div className="flex items-center gap-3 rounded-lg border bg-white px-3 py-2">
      {thumbnailUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={thumbnailUrl}
          alt=""
          className="h-12 w-20 rounded object-cover shrink-0"
        />
      ) : (
        <div className="flex h-12 w-20 items-center justify-center rounded bg-red-50 shrink-0">
          <MonitorPlay className="size-6 text-red-500" />
        </div>
      )}

      <div className="min-w-0 flex-1">
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="block text-sm font-medium truncate hover:underline"
          title={title}
        >
          {title}
        </a>
        {subtitleParts.length > 0 && (
          <p className="text-xs text-muted-foreground truncate">
            {subtitleParts.join(" · ")}
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label="Dismiss video card"
        className="rounded p-1 text-muted-foreground hover:bg-muted shrink-0"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}
