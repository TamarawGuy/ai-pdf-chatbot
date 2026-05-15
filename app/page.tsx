import Link from "next/link";
import { ArrowRight, FileText, Play, Sparkles } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function Home() {
  return (
    <div className="relative flex flex-1 flex-col overflow-y-auto">
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-linear-to-br from-violet-100/60 via-white to-rose-100/40"
      />
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,rgba(148,163,184,0.18)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.18)_1px,transparent_1px)] bg-size-[32px_32px] mask-[radial-gradient(ellipse_at_center,black_40%,transparent_85%)]"
      />

      <main className="relative z-10 flex flex-1 flex-col items-center gap-6 px-4 py-4 md:mt-4 md:justify-center md:gap-10 md:py-0">
        <span className="inline-flex items-center gap-2 rounded-full border border-foreground/10 bg-white/80 px-3 py-1 text-xs text-muted-foreground shadow-sm backdrop-blur-sm">
          <Sparkles className="h-3.5 w-3.5 text-violet-500" />
          Now with streaming responses
        </span>

        <h1 className="max-w-2xl text-center text-4xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
          Chat with your{" "}
          <span className="font-serif font-normal italic text-blue-600">
            documents
          </span>{" "}
          and{" "}
          <span className="font-serif font-normal italic text-blue-600">
            videos
          </span>
          .
        </h1>

        <p className="max-w-xl text-center text-base text-muted-foreground">
          Upload a PDF or paste a YouTube link, and start a conversation. Get
          summaries, ask follow-ups, and pull out exactly what you need — in
          seconds.
        </p>

        <div className="grid w-full max-w-3xl grid-cols-1 gap-4 sm:grid-cols-2">
          <Card className="bg-white/70 shadow-[0_0_20px_rgba(15,23,42,0.17)] backdrop-blur-sm">
            <CardHeader>
              <span className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-violet-100 text-violet-600">
                <FileText className="h-4 w-4" />
              </span>
              <CardTitle>Chat with PDFs</CardTitle>
              <CardDescription>
                Drop in a research paper, contract, or report. Ask anything and
                get cited answers.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link
                href="/chat"
                className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:underline"
              >
                Open PDF chat <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </CardContent>
          </Card>

          <Card className="bg-white/70 shadow-[0_0_20px_rgba(15,23,42,0.17)] backdrop-blur-sm">
            <CardHeader>
              <span className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-violet-100 text-violet-600">
                <Play className="h-4 w-4" />
              </span>
              <CardTitle>Chat with YouTube</CardTitle>
              <CardDescription>
                Paste a video URL and we&apos;ll grab the transcript. Skip to
                the answer without scrubbing.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link
                href="/youtube-bot"
                className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:underline"
              >
                Open YouTube chat <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>

      <footer className="relative z-10 flex items-center justify-end px-6 py-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          All systems normal
        </span>
      </footer>
    </div>
  );
}
