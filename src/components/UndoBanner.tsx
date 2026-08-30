import { Button } from "@/components/ui/button";
import { useTranslation } from "../i18n/useTranslation";

interface UndoBannerProps {
  message: string;
  onUndo: () => void;
}

// Sits above the pinned Log income/expense bar (bottom-[132px] =
// BottomTabBar's real height + the action bar's real height + an 8px
// gap, measured directly — both only ever render on the same
// property/unit page as this, so it's safe to hardcode the stack order)
// rather than a full Radix Toast stack — only one delete is ever
// undoable at a time in this app, so a single fixed banner is all
// that's needed.
export function UndoBanner({ message, onUndo }: UndoBannerProps) {
  const { t } = useTranslation();
  return (
    <div className="fixed inset-x-0 bottom-[132px] z-50 flex justify-center px-4">
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
