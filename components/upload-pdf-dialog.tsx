"use client";

import { useState, type ChangeEvent } from "react";
import { Loader2, Upload } from "lucide-react";
import { toast } from "sonner";

import { processPdfFile } from "@/app/upload/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

const UploadPdfDialog = () => {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "error" | "success";
    text: string;
  } | null>(null);

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append("pdf", file);

      const result = await processPdfFile(formData);

      if (result.success) {
        e.target.value = "";
        setMessage(null);
        setOpen(false);
        toast.success("PDF ready", {
          description: "You can now ask questions about this document.",
        });
      } else {
        setMessage({
          type: "error",
          text: "Failed to process PDF",
        });
      }
    } catch (err) {
      console.error("Error while processing PDF: ", err);
      setMessage({
        type: "error",
        text: "Error occured while processing PDF",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) {
      setMessage(null);
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Upload />
          Upload
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload PDF</DialogTitle>
          <DialogDescription>
            Add a PDF to your knowledge base. It will be parsed and indexed for
            chat.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Label htmlFor="pdf-upload">PDF file</Label>
          <Input
            id="pdf-upload"
            type="file"
            accept=".pdf"
            onChange={handleFileUpload}
            disabled={isLoading}
            className="mt-2"
          />
          {isLoading && (
            <div className="flex items-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-muted-foreground">Processing PDF...</span>
            </div>
          )}
          {message && (
            <Alert
              variant={message.type === "error" ? "destructive" : "default"}
            >
              <AlertTitle>
                {message.type === "error" ? "Error!" : "Success!"}
              </AlertTitle>
              <AlertDescription>{message.text}</AlertDescription>
            </Alert>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UploadPdfDialog;
