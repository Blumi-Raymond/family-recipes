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
    // As is; then with quote marks inside texts repaired (see below)
    for (const attempt of [json, escapeInnerQuotes(json)]) {
      let data: unknown;
      try {
        data = JSON.parse(attempt);
      } catch {
        continue;
      }
      return checkScanAnswer(data);
    }
  }
  return { ok: false, error: "notJson" };
}

// Hebrew writes abbreviations and quotes with a plain " (ק"ג, עמ"ש, "3-2"),
// and chats often leave it like that inside the JSON texts — which ends the
// text early and breaks the whole answer. Repair: inside a text, a " is
// kept as the END of the text only if what follows looks like JSON goes on
// (":" , "}" , "]" , or "," followed by the next value). Any other " becomes \".
// Valid JSON is never changed by this (its inner quotes are already \").
export function escapeInnerQuotes(json: string): string {
  let out = "";
  let inText = false;
  for (let i = 0; i < json.length; i++) {
    const c = json[i];
    if (!inText) {
      if (c === '"') inText = true;
      out += c;
      continue;
    }
    if (c === "\\") {
      out += c + (json[i + 1] ?? "");
      i++;
      continue;
    }
    if (c === '"') {
      if (endsText(json, i + 1)) {
        inText = false;
        out += c;
      } else {
        out += '\\"';
      }
      continue;
    }
    out += c;
  }
  return out;
}

const nextChar = (s: string, from: number) => {
  let i = from;
  while (i < s.length && /\s/.test(s[i])) i++;
  return { char: s[i] ?? "", at: i };
};

// Does the text end at this " ? (`from` = the position right after it)
function endsText(s: string, from: number): boolean {
  const next = nextChar(s, from);
  if (next.char === "" || next.char === ":" || next.char === "}" || next.char === "]") return true;
  if (next.char !== ",") return false;
  // `"a", "b"` / `"a", {` ... — not `"he said "hi", then"`
  const after = nextChar(s, next.at + 1);
  if (/["{[\-0-9]/.test(after.char)) return true;
  return /^(true|false|null)(?![\p{L}\p{N}_])/u.test(s.slice(after.at, after.at + 6));
}

// Already-parsed data (the direct path, or the scan log): same check
export function checkScanAnswer(data: unknown): ParseResult {
  if (typeof data !== "object" || data === null || Array.isArray(data)) {
    return { ok: false, error: "wrongShape" };
  }
  const checked = scanAnswerSchema.safeParse(data);
  return checked.success ? { ok: true, answer: checked.data } : { ok: false, error: "wrongShape" };
}
