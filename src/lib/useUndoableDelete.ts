import { useQueryClient, type QueryKey } from "@tanstack/react-query";
import { useRef, useState } from "react";

interface UseUndoableDeleteOptions<T> {
  queryKey: QueryKey;
  getId: (item: T) => string;
  onCommit: (item: T) => Promise<void>;
  windowMs?: number;
}

// Shared by expenses and income (issue #10): tapping Delete doesn't call
// the real delete right away — it optimistically hides the row and starts
// a timer. Undo cancels the timer and puts the row back; letting the
// window expire fires the actual Sheets delete. Only one delete is ever
// in flight per hook instance, which is all either screen needs (see
// UndoBanner — a single fixed banner, not a queue).
export function useUndoableDelete<T>({
  queryKey,
  getId,
  onCommit,
  windowMs = 6000,
}: UseUndoableDeleteOptions<T>) {
  const queryClient = useQueryClient();
  const [pendingItem, setPendingItem] = useState<T | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function remove(item: T) {
    queryClient.setQueryData<T[]>(queryKey, (old) =>
      (old ?? []).filter((existing) => getId(existing) !== getId(item)),
    );
    setPendingItem(item);
    timeoutRef.current = setTimeout(() => {
      setPendingItem(null);
      timeoutRef.current = null;
      onCommit(item).catch(() => {
        // The window already closed and the row is gone from the visible
        // list — re-insert it rather than silently losing data on a
        // network hiccup. Rare path, not a retry queue (see plan).
        queryClient.setQueryData<T[]>(queryKey, (old) => [
          ...(old ?? []),
          item,
        ]);
      });
    }, windowMs);
  }

  function undo() {
    if (!pendingItem) return;
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    queryClient.setQueryData<T[]>(queryKey, (old) => [
      ...(old ?? []),
      pendingItem,
    ]);
    setPendingItem(null);
  }

  return { pendingItem, remove, undo };
}
