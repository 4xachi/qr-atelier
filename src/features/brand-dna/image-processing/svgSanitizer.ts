export const ACCEPTED_LOGO_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/svg+xml',
] as const;

export const MAX_LOGO_FILE_BYTES = 5 * 1024 * 1024; // 5 MB

export interface ImageValidationResult {
  valid: boolean;
  error?: string;
  isSvg: boolean;
}

export interface SvgSanitizationResult {
  safe: boolean;
  sanitizedSvg: string;
  removedElements: string[];
  removedAttributes: string[];
  error?: string;
}

export function validateLogoFileMeta(
  fileName: string,
  mimeType: string,
  byteSize: number
): ImageValidationResult {
  if (byteSize <= 0) {
    return { valid: false, isSvg: false, error: 'The selected image file is empty.' };
  }
  if (byteSize > MAX_LOGO_FILE_BYTES) {
    return {
      valid: false,
      isSvg: false,
      error: 'Logo file exceeds the 5 MB browser performance limit. Please choose a smaller file.',
    };
  }

  const lowerName = fileName.toLowerCase();
  const isSvg = mimeType === 'image/svg+xml' || lowerName.endsWith('.svg');
  const isAcceptedRaster =
    mimeType === 'image/png' ||
    mimeType === 'image/jpeg' ||
    mimeType === 'image/webp' ||
    lowerName.endsWith('.png') ||
    lowerName.endsWith('.jpg') ||
    lowerName.endsWith('.jpeg') ||
    lowerName.endsWith('.webp');

  if (!isSvg && !isAcceptedRaster) {
    return {
      valid: false,
      isSvg: false,
      error: 'Unsupported image format. Upload PNG, JPEG, WebP, or SVG.',
    };
  }

  return { valid: true, isSvg };
}

const DANGEROUS_TAGS = [
  'script',
  'foreignObject',
  'iframe',
  'object',
  'embed',
  'applet',
  'meta',
  'link',
  'base',
];

/**
 * Strictly sanitizes untrusted SVG markup before rasterization so scripts,
 * event handlers, foreignObject HTML, and external/javascript URIs cannot run.
 */
export function sanitizeSvgMarkup(rawSvg: string): SvgSanitizationResult {
  const trimmed = rawSvg.trim();
  if (!trimmed || !/<svg[\s>]/i.test(trimmed)) {
    return {
      safe: false,
      sanitizedSvg: '',
      removedElements: [],
      removedAttributes: [],
      error: 'File does not contain a valid <svg> root element.',
    };
  }

  let sanitized = trimmed;
  const removedElements: string[] = [];
  const removedAttributes: string[] = [];

  // Strip XML processing instructions / DOCTYPE / entity declarations (XXE prevention)
  sanitized = sanitized.replace(/<!DOCTYPE[\s\S]*?>/gi, '');
  sanitized = sanitized.replace(/<!ENTITY[\s\S]*?>/gi, '');

  // Strip dangerous paired tags and self-closing tags
  for (const tag of DANGEROUS_TAGS) {
    const pairedRegex = new RegExp(`<${tag}\\b[^>]*>[\\s\\S]*?<\\/${tag}>`, 'gi');
    const selfClosingRegex = new RegExp(`<${tag}\\b[^>]*\\/?>`, 'gi');
    if (pairedRegex.test(sanitized) || selfClosingRegex.test(sanitized)) {
      removedElements.push(tag);
      sanitized = sanitized.replace(pairedRegex, '').replace(selfClosingRegex, '');
    }
  }

  // Remove inline event handler attributes (onload=, onclick=, onerror=, etc.)
  sanitized = sanitized.replace(/\s+on[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, (match) => {
    const attrName = match.trim().split('=')[0];
    removedAttributes.push(attrName);
    return '';
  });

  // Remove javascript:, vbscript:, data:text/html URIs in href/xlink:href/src/style
  sanitized = sanitized.replace(
    /\s+(?:xlink:)?(?:href|src)\s*=\s*(?:"([^"]*)"|'([^']*)')/gi,
    (full, dq, sq) => {
      const val = (dq ?? sq ?? '').trim();
      if (/^(?:javascript:|vbscript:|data:text\/html|https?:\/\/|\/\/)/i.test(val)) {
        removedAttributes.push('unsafe-href');
        return '';
      }
      return full;
    }
  );

  // Strip CSS expression() or url(http/javascript) inside style tags or attributes
  sanitized = sanitized.replace(/expression\s*\([^)]*\)/gi, () => {
    removedAttributes.push('css-expression');
    return '';
  });
  sanitized = sanitized.replace(/url\(\s*['"]?\s*(?:javascript:|https?:\/\/)[^)]*\)/gi, () => {
    removedAttributes.push('unsafe-css-url');
    return 'none';
  });

  // Ensure SVG still has root <svg> tag after sanitization
  if (!/<svg[\s>]/i.test(sanitized)) {
    return {
      safe: false,
      sanitizedSvg: '',
      removedElements,
      removedAttributes,
      error: 'SVG contained no safe visual markup after sanitization.',
    };
  }

  return {
    safe: true,
    sanitizedSvg: sanitized,
    removedElements: Array.from(new Set(removedElements)),
    removedAttributes: Array.from(new Set(removedAttributes)),
  };
}
