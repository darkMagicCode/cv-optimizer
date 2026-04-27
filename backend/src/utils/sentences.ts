/**
 * Best-effort English sentence count for short LLM paragraphs (e.g. verdict text).
 *
 * Splits on whitespace after `.`, `!`, or `?`. This is a heuristic: abbreviations
 * (`e.g.`, `Dr.`), decimal numbers, URLs, and ellipsis can miscount. Sufficient
 * for validating that a verdict is roughly 2–3 sentences as in the product spec.
 */
export function countSentences(text: string): number {
  const t = text.trim().replace(/\s+/g, ' ')
  if (!t) return 0
  const parts = t.split(/(?<=[.!?])\s+/)
  return parts.filter((p) => p.length > 0).length
}
