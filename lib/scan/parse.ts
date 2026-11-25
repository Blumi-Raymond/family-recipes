// Reading an answer pasted from a chat (the free path). Chats often wrap the
// JSON in ```json fences or add a sentence before/after it — that is fine.
// After that, the same check as the direct path (scanAnswerSchema).
//
// Safe to import anywhere (browser, server, tests).
import { scanAnswerSchema, type ScanAnswer } from "./answer";

export const MAX_PASTE_LENGTH = 300_000; // far more than any real answer

export type ParseResult =
  | { ok: true; answer: ScanAnswer }
  | { ok: false; error: "empty" | "tooLong" | "notJson" | "wrongShape" };

// Where the JSON object may be, best guess first:
//   1. inside a ```json (or ```) code block — chats put it there, and any
//      text around the block may contain braces of its own
//   2. from the first "{" to the last "}" of the whole text
function candidates(text: string): string[] {
  const found: string[] = [];
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) found.push(fenced[1]);
  found.push(text);
  return found
    .map((t) => {
      const start = t.indexOf("{");
      const end = t.lastIndexOf("}");
      return start === -1 || end <= start ? "" : t.slice(start, end + 1);
    })
    .filter(Boolean);
}

export function parseScanAnswer(pasted: string): ParseResult {
  const text = pasted.replace(/^﻿/, "").trim();
  if (!text) return { ok: false, error: "empty" };
  if (text.length > MAX_PASTE_LENGTH) return { ok: false, error: "tooLong" };

  for (const json of candidates(text)) {
    let data: unknown;
    try {
      data = JSON.parse(json);
    } catch {
      continue; // try the next place
    }
    return checkScanAnswer(data);
  }
  return { ok: false, error: "notJson" };
}

// Already-parsed data (the direct path, or the scan log): same check
export function checkScanAnswer(data: unknown): ParseResult {
  if (typeof data !== "object" || data === null || Array.isArray(data)) {
    return { ok: false, error: "wrongShape" };
  }
  const checked = scanAnswerSchema.safeParse(data);
  return checked.success ? { ok: true, answer: checked.data } : { ok: false, error: "wrongShape" };
}
