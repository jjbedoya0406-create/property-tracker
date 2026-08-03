import type { ChangeEvent } from "react";

interface ReceiptCaptureInputProps {
  onCapture: (file: File) => void;
  disabled?: boolean;
}

// `capture="environment"` opens the device's rear camera directly on mobile
// browsers (the PRD's "well-supported in mobile browsers today" bet, rather
// than a custom getUserMedia/canvas camera UI) and falls back to a plain
// file picker on desktop.
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
    <label>
      Take photo of receipt
      <input
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleChange}
        disabled={disabled}
      />
    </label>
  );
}
