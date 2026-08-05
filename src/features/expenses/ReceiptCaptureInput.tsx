import { Camera } from "lucide-react";
import type { ChangeEvent } from "react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ReceiptCaptureInputProps {
  onCapture: (file: File) => void;
  disabled?: boolean;
}

// `capture="environment"` opens the device's rear camera directly on mobile
// browsers (the PRD's "well-supported in mobile browsers today" bet, rather
// than a custom getUserMedia/canvas camera UI) and falls back to a plain
// file picker on desktop. The native <input type="file"> can't be styled
// directly, so it's visually hidden behind a label styled like a button.
export function ReceiptCaptureInput({
  onCapture,
  disabled,
}: ReceiptCaptureInputProps) {
  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) {
      onCapture(file);
    }
    event.target.value = "";
  }

  return (
    <label
      className={cn(
        buttonVariants({ variant: "outline" }),
        "w-full cursor-pointer",
        disabled && "pointer-events-none opacity-50",
      )}
    >
      <Camera className="size-4" />
      Take photo of receipt
      <input
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleChange}
        disabled={disabled}
        className="sr-only"
      />
    </label>
  );
}
