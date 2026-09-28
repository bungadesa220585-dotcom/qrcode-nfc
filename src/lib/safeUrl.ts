/**
 * Safe URL validation and sanitization
 * Ensures destinations do not execute unsafe schemes like javascript:, data:, etc.
 */

export function isValidHttpUrl(stringUrl: string): boolean {
  if (!stringUrl || typeof stringUrl !== 'string') return false;
  const trimmed = stringUrl.trim();
  try {
    const url = new URL(trimmed);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    // If user forgot protocol e.g. "mywebsite.com"
    if (/^[a-zA-Z0-9][-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)$/.test(trimmed)) {
      return true;
    }
    return false;
  }
}

export function sanitizeUrl(stringUrl: string): string {
  if (!stringUrl) return '';
  const trimmed = stringUrl.trim();
  
  // Prohibit unsafe schemes
  const lower = trimmed.toLowerCase();
  if (
    lower.startsWith('javascript:') ||
    lower.startsWith('data:') ||
    lower.startsWith('vbscript:') ||
    lower.startsWith('file:')
  ) {
    return 'about:blank';
  }

  // Prepend https:// if protocol is missing
  if (!/^https?:\/\//i.test(trimmed)) {
    return `https://${trimmed}`;
  }

  return trimmed;
}

/**
 * Validates intermediate unique ID format
 */
export function sanitizeUniqueId(id: string): string {
  return id.replace(/[^a-zA-Z0-9-_]/g, '').slice(0, 32);
}
