/**
 * Serialise a JSON-LD graph for embedding in a <script type="application/ld+json">.
 *
 * Angle brackets and ampersands are escaped so no stored value — an article
 * title, for example — can close the script element and inject markup.
 */
export function jsonLdScript(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}
