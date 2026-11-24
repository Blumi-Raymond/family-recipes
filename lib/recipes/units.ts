// Suggestions in the ingredient "unit" field, by the RECIPE's language
// (an English recipe gets English units even when the site is in Hebrew).
// Free text is always allowed — these are only suggestions.
export const UNIT_SUGGESTIONS: Record<"he" | "en", string[]> = {
  he: ["כוס", "כוסות", "כף", "כפות", "כפית", "כפיות", "גרם", "ק״ג", "מ״ל", "ליטר", "יחידה", "יחידות", "חבילה", "שקית", "פחית", "קורט", "שן", "שיני"],
  en: ["cup", "cups", "tbsp", "tsp", "g", "kg", "ml", "l", "oz", "lb", "stick", "package", "can", "pinch", "clove", "cloves"],
};
