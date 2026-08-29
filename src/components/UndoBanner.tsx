import { Button } from "@/components/ui/button";
import { useTranslation } from "../i18n/useTranslation";

interface UndoBannerProps {
  message: string;
  onUndo: () => void;
}

// Sits above BottomTabBar (bottom-24, clearing its ~fixed height) rather
// than a full Radix Toast stack — only one delete is ever undoable at a
// time in this app, so a single fixed banner is all that's needed.
export function UndoBanner({ message, onUndo }: UndoBannerProps) {
  const { t } = useTranslation();
  return (
    <div className="fixed inset-x-0 bottom-24 z-50 flex justify-center px-4">
      <div className="flex items-center gap-3 rounded-lg bg-foreground px-4 py-2.5 text-sm text-background shadow-lg">
        <span>{message}</span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-auto p-0 text-background underline underline-offset-2 hover:bg-transparent hover:text-background"
          onClick={onUndo}
        >
          {t("common.undo")}
        </Button>
      </div>
    </div>
  );
}
