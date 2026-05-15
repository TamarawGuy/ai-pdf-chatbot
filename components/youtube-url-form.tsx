"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import { loadYoutubeVideoAction } from "@/app/youtube-bot/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? (
        <>
          <Loader2 className="animate-spin" />
          Fetching transcript…
        </>
      ) : (
        "Load Video"
      )}
    </Button>
  );
}

export default function YoutubeUrlForm() {
  const [state, formAction] = useActionState(loadYoutubeVideoAction, {
    error: null,
  });

  return (
    <form
      action={formAction}
      className="w-full max-w-md space-y-4 border rounded-lg p-6 shadow-sm bg-background"
    >
      <div className="space-y-1">
        <h1 className="text-xl font-semibold">Chat with a YouTube video</h1>
        <p className="text-sm text-muted-foreground">
          Paste a YouTube URL and we’ll fetch its transcript so you can ask
          questions about it.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="url">YouTube URL</Label>
        <Input
          id="url"
          name="url"
          type="url"
          required
          placeholder="https://www.youtube.com/watch?v=…"
          autoFocus
        />
      </div>

      {state?.error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      <SubmitButton />
    </form>
  );
}
