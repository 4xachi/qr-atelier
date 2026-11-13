import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildBrandPaletteSuggestions,
  contrastRatioHex,
  extractDominantColorsFromRgba,
} from './palette/colorMath';
import {
  MAX_LOGO_FILE_BYTES,
  sanitizeSvgMarkup,
  validateLogoFileMeta,
} from './image-processing/svgSanitizer';

test('Image metadata validator handles empty, oversized, unsupported, and valid formats', () => {
  assert.equal(validateLogoFileMeta('logo.png', 'image/png', 1024).valid, true);
  assert.equal(validateLogoFileMeta('mark.svg', 'image/svg+xml', 512).isSvg, true);
  assert.equal(validateLogoFileMeta('empty.png', 'image/png', 0).valid, false);
  assert.equal(
    validateLogoFileMeta('huge.png', 'image/png', MAX_LOGO_FILE_BYTES + 1).valid,
    false
  );
  assert.equal(validateLogoFileMeta('archive.zip', 'application/zip', 1024).valid, false);
});

test('SVG sanitizer strips scripts, event handlers, foreignObject, and unsafe URLs', () => {
  const maliciousSvg = `
    <!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://evil.example/dtd">
    <svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)" viewBox="0 0 100 100">
      <script>fetch('https://evil.example')</script>
      <foreignObject width="50" height="50"><body><iframe src="https://evil.example"></iframe></body></foreignObject>
      <a href="javascript:alert(2)"><circle cx="50" cy="50" r="40" fill="#0F766E" onclick="steal()" /></a>
      <image href="https://tracker.example/pixel.png" width="10" height="10" />
    </svg>
  `;
  const result = sanitizeSvgMarkup(maliciousSvg);
  assert.equal(result.safe, true);
  assert.ok(!result.sanitizedSvg.includes('<script'));
  assert.ok(!result.sanitizedSvg.includes('foreignObject'));
  assert.ok(!result.sanitizedSvg.includes('onload'));
  assert.ok(!result.sanitizedSvg.includes('onclick'));
  assert.ok(!result.sanitizedSvg.includes('javascript:'));
  assert.ok(!result.sanitizedSvg.includes('tracker.example'));
  assert.ok(result.sanitizedSvg.includes('<circle'));
  assert.ok(result.removedElements.includes('script'));
  assert.ok(result.removedAttributes.includes('onload'));
});

test('Palette extraction ignores transparent pixels and extracts dominant colors deterministically', () => {
  // Build a 10x10 RGBA buffer: 50% transparent, 35% deep teal (#0F766E -> 15,118,110), 15% amber (#D97706 -> 217,119,6)
  const rgba = new Uint8ClampedArray(100 * 4);
  for (let i = 0; i < 100; i++) {
    const o = i * 4;
    if (i < 50) {
      rgba[o] = 0;
      rgba[o + 1] = 0;
      rgba[o + 2] = 0;
      rgba[o + 3] = 0; // transparent
    } else if (i < 85) {
      rgba[o] = 15;
      rgba[o + 1] = 118;
      rgba[o + 2] = 110;
      rgba[o + 3] = 255;
    } else {
      rgba[o] = 217;
      rgba[o + 1] = 119;
      rgba[o + 2] = 6;
      rgba[o + 3] = 255;
    }
  }

  const colors = extractDominantColorsFromRgba(rgba, 4);
  assert.ok(colors.length >= 2);
  assert.equal(colors[0], '#0F766E');
  assert.equal(colors[1], '#D97706');

  const suggestions = buildBrandPaletteSuggestions(colors);
  assert.equal(suggestions.length, 4);
  for (const s of suggestions) {
    assert.ok(s.contrastRatio >= 4.5, `${s.id} should meet readable contrast (${s.contrastRatio})`);
  }
  assert.ok(contrastRatioHex('#0F172A', '#FFFFFF') > 15);
});
