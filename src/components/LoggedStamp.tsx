import { Check } from "lucide-react";
import { useEffect, useState } from "react";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { cn } from "@/lib/utils";
import { useTranslation } from "../i18n/useTranslation";

interface LoggedStampProps {
  className?: string;
}

// The app's one deliberate moment of visual personality
// (Design_System_v0.1.md "Concept"): a brief "LOGGED" ink-stamp mark next to
// a newly-saved row, settling into a quiet permanent checkmark after ~1.5s.
// Purely decorative feedback — never blocks the UI.
export function LoggedStamp({ className }: LoggedStampProps) {
  const { t } = useTranslation();
  const prefersReducedMotion = usePrefersReducedMotion();
  const [settled, setSettled] = useState(prefersReducedMotion);

  useEffect(() => {
    if (prefersReducedMotion) {
      setSettled(true);
      return;
    }
    const timer = setTimeout(() => setSettled(true), 1500);
    return () => clearTimeout(timer);
  }, [prefersReducedMotion]);

  if (settled) {
    return (
      <Check
        aria-label={t("loggedStamp.text")}
        className={cn("h-4 w-4 text-stamp", className)}
      />
    );
  }

  return (
    <span
      role="status"
      className={cn(
        "border-stamp text-stamp animate-stamp-in inline-flex items-center justify-center rounded-full border-2 px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase",
        className,
      )}
    >
      {t("loggedStamp.text")}
    </span>
  );
}
