/**
 * Accessibility Utilities
 * Helper functions to ensure WCAG AAA compliance
 */

/**
 * Truncates alt text to be concise while remaining descriptive
 * WCAG AAA 1.4.9: Images of Text (No Exception)
 * Alt text should be concise (ideally under 10 words)
 *
 * @param text - The full text to use as alt
 * @param maxWords - Maximum number of words (default: 8)
 * @returns Truncated text suitable for alt attribute
 */
export function getAccessibleAltText(
  text: string,
  maxWords: number = 8
): string {
  if (!text) return '';

  const words = text.trim().split(/\s+/);

  if (words.length <= maxWords) {
    return text.trim();
  }

  // Truncate and add ellipsis
  return words.slice(0, maxWords).join(' ') + '...';
}

/**
 * Creates descriptive but concise alt text for book covers
 *
 * @param title - Book title
 * @returns Accessible alt text
 */
export function getBookCoverAlt(title: string): string {
  const prefix = 'Portada de';
  const truncatedTitle = getAccessibleAltText(title, 6); // Leave room for prefix
  return `${prefix} ${truncatedTitle}`;
}

/**
 * Creates descriptive but concise alt text for creator/author images
 *
 * @param name - Creator/author name
 * @returns Accessible alt text
 */
export function getCreatorImageAlt(name: string): string {
  return `Foto de ${name}`;
}
