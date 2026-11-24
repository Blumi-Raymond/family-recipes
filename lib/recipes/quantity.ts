// Ingredient amounts: text in the form <-> numbers in the database.
// "2" -> 2 · "1.5" / "1,5" -> 1.5 · "1/2" -> 0.5 · "1 1/2" / "1½" -> 1.5
// "2-3" / "2–3" -> 2 to 3. Display: 1.5 -> "1½", 0.333 -> "⅓".

const UNICODE_FRACTIONS: Record<string, number> = {
  "½": 1 / 2,
  "⅓": 1 / 3,
  "⅔": 2 / 3,
  "¼": 1 / 4,
  "¾": 3 / 4,
  "⅛": 1 / 8,
  "⅜": 3 / 8,
  "⅝": 5 / 8,
  "⅞": 7 / 8,
};

// One number: "2", "1.5", "1,5", "1/2", "1 1/2", "1½", "½"
function parseOne(text: string): number | null {
  let s = text.trim().replace(",", ".");
  if (!s) return null;

  let total = 0;
  const lastChar = s.slice(-1);
  if (lastChar in UNICODE_FRACTIONS) {
    total += UNICODE_FRACTIONS[lastChar];
    s = s.slice(0, -1).trim();
    if (!s) return total;
  }

  // "1 1/2"
  const mixed = s.match(/^(\d+)\s+(\d+)\s*\/\s*(\d+)$/);
  if (mixed) {
    const [, whole, num, den] = mixed.map(Number);
    return den ? total + whole + num / den : null;
  }
  // "1/2"
  const fraction = s.match(/^(\d+)\s*\/\s*(\d+)$/);
  if (fraction) {
    const [, num, den] = fraction.map(Number);
    return den ? total + num / den : null;
  }
  // "2", "1.5", ".5"
  if (/^(\d+(\.\d+)?|\.\d+)$/.test(s)) return total + Number(s);

  return null;
}

export type ParsedQuantity = { quantity: number | null; quantityMax: number | null };

// Whole field. Empty -> no amount ("salt to taste"). Invalid -> null.
export function parseQuantity(text: string): ParsedQuantity | null {
  const s = text.trim();
  if (!s) return { quantity: null, quantityMax: null };

  // A range: "2-3", "2 - 3", "2–3". (A leading "-" is not a range.)
  const parts = s.split(/\s*[-–—]\s*/);
  if (parts.length === 2 && parts[0] && parts[1]) {
    const min = parseOne(parts[0]);
    const max = parseOne(parts[1]);
    if (min === null || max === null || min <= 0 || max < min) return null;
    return { quantity: round(min), quantityMax: max === min ? null : round(max) };
  }
  if (parts.length > 1) return null;

  const value = parseOne(s);
  if (value === null || value <= 0) return null;
  return { quantity: round(value), quantityMax: null };
}

// Store fractions like 1/3 with enough digits to show them back as ⅓
function round(n: number) {
  return Math.round(n * 10000) / 10000;
}

const DISPLAY_FRACTIONS: [number, string][] = [
  [1 / 8, "⅛"],
  [1 / 4, "¼"],
  [1 / 3, "⅓"],
  [3 / 8, "⅜"],
  [1 / 2, "½"],
  [5 / 8, "⅝"],
  [2 / 3, "⅔"],
  [3 / 4, "¾"],
  [7 / 8, "⅞"],
];

function formatOne(n: number): string {
  const whole = Math.floor(n);
  const rest = n - whole;
  if (rest < 0.005) return String(whole);
  const match = DISPLAY_FRACTIONS.find(([value]) => Math.abs(value - rest) < 0.01);
  if (match) return whole ? `${whole}${match[1]}` : match[1];
  // Anything else: up to 2 decimals, no trailing zeros
  return String(Math.round(n * 100) / 100);
}

// For the recipe page: 1.5 -> "1½", 2..3 -> "2–3"
export function formatQuantity(quantity: number | null, quantityMax: number | null): string {
  if (quantity === null) return "";
  if (quantityMax === null || quantityMax === quantity) return formatOne(quantity);
  return `${formatOne(quantity)}–${formatOne(quantityMax)}`;
}

// For the edit form: numbers back to text she can edit ("1½", "2-3")
export function quantityToText(quantity: number | null, quantityMax: number | null): string {
  if (quantity === null) return "";
  if (quantityMax === null || quantityMax === quantity) return formatOne(quantity);
  return `${formatOne(quantity)}-${formatOne(quantityMax)}`;
}
