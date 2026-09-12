import { CircleAlert, FileImage, UploadCloud, X } from "lucide-react";
import { useRef, useState, type DragEvent } from "react";

import { cn } from "@/lib/utils";

type UploadDropzoneProps = {
  file: File | null;
  preview: string;
  error: string;
  onFile: (file: File) => void;
  onRemove: () => void;
  scanning?: boolean;
  className?: string;
  accept?: string;
};

export function UploadDropzone({
  file,
  preview,
  error,
  onFile,
  onRemove,
  scanning = false,
  className,
  accept = "image/jpeg,image/png,image/webp",
}: UploadDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    const next = event.dataTransfer.files?.[0];
    if (next instanceof File) onFile(next);
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div
        role="button"
        tabIndex={0}
        aria-label={
          file
            ? "Preview of your lab report. Press Enter to replace it."
            : "Upload your lab report. Drag and drop or press Enter to browse."
        }
        onClick={() => inputRef.current?.click()}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={cn(
          "relative min-h-[320px] cursor-pointer overflow-hidden rounded-3xl border-2 border-dashed outline-none transition-all duration-300",
          dragging
            ? "scale-[1.005] border-primary bg-primary/5"
            : file
              ? "border-primary/30 bg-secondary/25"
              : "border-input bg-muted/40 hover:border-primary/55 hover:bg-muted/60",
          className,
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          aria-hidden
          tabIndex={-1}
          className="pointer-events-none absolute inset-0 size-full opacity-0"
          onChange={(event) => {
            const next = event.target.files?.[0];
            if (next) onFile(next);
            event.target.value = "";
          }}
        />

        {file && preview ? (
          <>
            <img
              src={preview}
              alt="Selected lab report preview"
              className="absolute inset-0 size-full object-contain p-6"
            />
            {scanning && (
              <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-primary shadow-[0_0_18px_var(--primary)] animate-scan" />
            )}
            <button
              type="button"
              aria-label="Remove selected image"
              onClick={(event) => {
                event.stopPropagation();
                onRemove();
              }}
              className="absolute right-4 top-4 z-10 grid size-9 place-items-center rounded-full border border-border bg-background/90 text-foreground shadow-soft transition-all hover:scale-105 hover:border-urgent/40 hover:text-urgent"
            >
              <X className="size-4" />
            </button>
            <div className="absolute inset-x-0 bottom-0 flex items-center gap-3 bg-hero/85 px-6 py-4 text-primary-foreground backdrop-blur">
              <FileImage className="size-5 shrink-0 text-accent" />
              <div className="min-w-0">
                <p className="truncate text-sm font-bold">{file.name}</p>
                <p className="text-xs text-primary-foreground/70">
                  {(file.size / 1024 / 1024).toFixed(1)} MB · Ready to analyze
                </p>
              </div>
            </div>
          </>
        ) : (
          <div className="absolute inset-0 grid place-items-center px-6 text-center">
            <div>
              <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-gradient-to-br from-primary to-[oklch(0.62_0.12_178)] text-primary-foreground shadow-soft">
                <UploadCloud className="size-7" />
              </span>
              <p className="mt-5 font-display text-xl font-semibold tracking-tight">
                Drop your lab report here
              </p>
              <p className="mt-1.5 text-sm text-muted-foreground">
                or click to browse · JPEG, PNG or WEBP
              </p>
              <div className="mt-5 inline-flex flex-wrap items-center justify-center gap-2">
                {["Up to 12 MB", "Private & secure", "English + Urdu"].map((chip) => (
                  <span
                    key={chip}
                    className="rounded-full border border-border bg-background px-3 py-1 text-xs font-semibold text-muted-foreground"
                  >
                    {chip}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-2xl border border-urgent/20 bg-urgent-soft px-4 py-3.5 text-sm font-semibold text-urgent animate-fade-in"
        >
          <CircleAlert className="mt-0.5 size-5 shrink-0" />
          {error}
        </div>
      )}
    </div>
  );
}
