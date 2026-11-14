/** Readable Unicode slugs, with Vietnamese accents removed and Korean kept in NFC. */
export function postSlug(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .normalize("NFC")
    .replace(/đ/g, "d")
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 180)
    .replace(/-$/, "");
}
