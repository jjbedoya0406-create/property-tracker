import { Stamp } from "lucide-react";
import { cn } from "@/lib/utils";

interface StampIconProps {
  className?: string;
  size?: number;
}

// Static decorative mark — distinct from the animated LoggedStamp (which
// only appears briefly on save). This is the small rotated navy stamp used
// in the header wordmark and on the sign-in screen, per
// UI_Polish_Handoff_v1.md.
export function StampIcon({ className, size = 20 }: StampIconProps) {
  return (
    <span
      aria-hidden="true"
      style={{ width: size, height: size }}
      className={cn(
        "border-stamp text-stamp inline-flex shrink-0 -rotate-6 items-center justify-center rounded-full border-2",
        className,
      )}
    >
      <Stamp className="size-1/2" />
    </span>
  );
}
