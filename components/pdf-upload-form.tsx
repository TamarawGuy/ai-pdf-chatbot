"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import { loadPdfAction } from "@/app/chat/actions";
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
          Processing PDF…
        </>
      ) : (
        "Load PDF"
      )}
    </Button>
  );
}

export default function PdfUploadForm() {
  const [state, formAction] = useActionState(loadPdfAction, {
    error: null,
  });

  return (
    <form
      action={formAction}
      className="w-full max-w-md space-y-4 border rounded-lg p-6 shadow-sm bg-background"
    >
      <div className="space-y-1">
        <h1 className="text-xl font-semibold">Chat with a PDF</h1>
        <p className="text-sm text-muted-foreground">
          Upload a PDF and we’ll index it so you can ask questions about it.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="pdf">PDF file</Label>
        <Input id="pdf" name="pdf" type="file" accept=".pdf" required />
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
