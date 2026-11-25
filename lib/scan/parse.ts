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

// The JSON object inside the pasted text: from the first "{" to the last "}"
function extractObject(text: string): string | null {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  return start === -1 || end <= start ? null : text.slice(start, end + 1);
}

export function parseScanAnswer(pasted: string): ParseResult {
  const text = pasted.replace(/^﻿/, "").trim();
  if (!text) return { ok: false, error: "empty" };
  if (text.length > MAX_PASTE_LENGTH) return { ok: false, error: "tooLong" };

  const json = extractObject(text);
  if (!json) return { ok: false, error: "notJson" };

  let data: unknown;
  try {
    data = JSON.parse(json);
  } catch {
    return { ok: false, error: "notJson" };
  }
  return checkScanAnswer(data);
}

// Already-parsed data (the direct path, or the scan log): same check
export function checkScanAnswer(data: unknown): ParseResult {
  if (typeof data !== "object" || data === null || Array.isArray(data)) {
    return { ok: false, error: "wrongShape" };
  }
  const checked = scanAnswerSchema.safeParse(data);
  return checked.success ? { ok: true, answer: checked.data } : { ok: false, error: "wrongShape" };
}
