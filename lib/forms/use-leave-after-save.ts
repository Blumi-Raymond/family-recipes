"use client";
// After a successful save, a form moves on to another page (router.push).
// Two things can go wrong in between, especially on a slow connection:
//   1. The save finishes before the next page shows, so the button would
//      come back to life — a second click would save the same item twice.
//   2. Next.js (Cache Components) keeps the form hidden for the browser's
//      "back" button, with everything still filled in.
// So: call startLeaving() right after a successful save. The button stays
// locked (`leaving`) until the page is really left, and only THEN, once the
// form is hidden, `onLeft` runs (e.g. to clear a new-item form).
// See node_modules/next/dist/docs/01-app/02-guides/preserving-ui-state.md.
import { useCallback, useLayoutEffect, useRef, useState } from "react";

export function useLeaveAfterSave(onLeft: () => void) {
  const [leaving, setLeaving] = useState(false);
  const leavingRef = useRef(false);
  const onLeftRef = useRef(onLeft);

  useLayoutEffect(() => {
    onLeftRef.current = onLeft;
  });

  // Runs when the page is hidden (or removed) — not before
  useLayoutEffect(
    () => () => {
      if (!leavingRef.current) return;
      leavingRef.current = false;
      setLeaving(false);
      onLeftRef.current();
    },
    [],
  );

  const startLeaving = useCallback(() => {
    leavingRef.current = true;
    setLeaving(true);
  }, []);

  return { leaving, startLeaving };
}
