import type { ZodIssue } from 'zod';
import {
  type ContentFormsState,
  type ContentType,
  type QrPayloadResult,
  emailSchema,
  phoneSchema,
  smsSchema,
  textSchema,
  urlSchema,
  vcardSchema,
  wifiSchema,
} from '../schemas/payloadSchemas';

/**
 * Escapes special characters in Wi-Fi QR fields per ZXing / WPA QR spec:
 * backslash, semicolon, comma, colon, and double quote.
 */
export function escapeWifiField(value: string): string {
  return value.replace(/([\\;,:"'])/g, '\\$1');
}

/**
 * Escapes special characters in vCard 3.0 property values.
 */
export function escapeVCardValue(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\r?\n/g, '\\n')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,');
}

function issuesToErrorMap(issues: ZodIssue[]): Record<string, string> {
  const map: Record<string, string> = {};
  for (const issue of issues) {
    const key = issue.path[0]?.toString() || '_form';
    if (!map[key]) {
      map[key] = issue.message;
    }
  }
  return map;
}

function utf8ByteLength(text: string): number {
  return new TextEncoder().encode(text).length;
}

export function normalizePhoneForUri(phone: string): string {
  return phone.trim().replace(/[\s()-]/g, '');
}

export function buildQrPayload(
  contentType: ContentType,
  forms: ContentFormsState
): QrPayloadResult {
  switch (contentType) {
    case 'url': {
      const parsed = urlSchema.safeParse(forms.url);
      if (!parsed.success) {
        return {
          valid: false,
          contentType,
          rawPayload: '',
          summary: 'Invalid URL',
          byteLength: 0,
          errors: issuesToErrorMap(parsed.error.issues),
        };
      }
      // Preserve exact URL string without rewriting query params, trailing slash, or case
      const rawPayload = parsed.data.url;
      return {
        valid: true,
        contentType,
        rawPayload,
        summary: `Opens URL: ${rawPayload}`,
        byteLength: utf8ByteLength(rawPayload),
        errors: {},
      };
    }

    case 'text': {
      const parsed = textSchema.safeParse(forms.text);
      if (!parsed.success) {
        return {
          valid: false,
          contentType,
          rawPayload: '',
          summary: 'Invalid text',
          byteLength: 0,
          errors: issuesToErrorMap(parsed.error.issues),
        };
      }
      const rawPayload = parsed.data.text;
      const preview = rawPayload.length > 80 ? `${rawPayload.slice(0, 77)}...` : rawPayload;
      return {
        valid: true,
        contentType,
        rawPayload,
        summary: `Plain text (${rawPayload.length} chars): "${preview}"`,
        byteLength: utf8ByteLength(rawPayload),
        errors: {},
      };
    }

    case 'wifi': {
      const parsed = wifiSchema.safeParse(forms.wifi);
      if (!parsed.success) {
        return {
          valid: false,
          contentType,
          rawPayload: '',
          summary: 'Invalid Wi-Fi configuration',
          byteLength: 0,
          errors: issuesToErrorMap(parsed.error.issues),
        };
      }
      const { ssid, encryption, password, hidden } = parsed.data;
      const parts = [
        `WIFI:T:${encryption}`,
        `S:${escapeWifiField(ssid)}`,
      ];
      if (encryption !== 'nopass') {
        parts.push(`P:${escapeWifiField(password)}`);
      }
      if (hidden) {
        parts.push('H:true');
      }
      const rawPayload = `${parts.join(';')};;`;
      const securityLabel = encryption === 'nopass' ? 'Open network' : encryption;
      return {
        valid: true,
        contentType,
        rawPayload,
        summary: `Join Wi-Fi "${ssid}" (${securityLabel}${hidden ? ', hidden' : ''})`,
        byteLength: utf8ByteLength(rawPayload),
        errors: {},
      };
    }

    case 'email': {
      const parsed = emailSchema.safeParse(forms.email);
      if (!parsed.success) {
        return {
          valid: false,
          contentType,
          rawPayload: '',
          summary: 'Invalid email configuration',
          byteLength: 0,
          errors: issuesToErrorMap(parsed.error.issues),
        };
      }
      const { address, subject, body } = parsed.data;
      const queryParams: string[] = [];
      if (subject) queryParams.push(`subject=${encodeURIComponent(subject)}`);
      if (body) queryParams.push(`body=${encodeURIComponent(body)}`);
      const rawPayload =
        queryParams.length > 0
          ? `mailto:${address}?${queryParams.join('&')}`
          : `mailto:${address}`;
      return {
        valid: true,
        contentType,
        rawPayload,
        summary: `Compose email to ${address}${subject ? ` — "${subject}"` : ''}`,
        byteLength: utf8ByteLength(rawPayload),
        errors: {},
      };
    }

    case 'phone': {
      const parsed = phoneSchema.safeParse(forms.phone);
      if (!parsed.success) {
        return {
          valid: false,
          contentType,
          rawPayload: '',
          summary: 'Invalid phone number',
          byteLength: 0,
          errors: issuesToErrorMap(parsed.error.issues),
        };
      }
      const normalized = normalizePhoneForUri(parsed.data.phone);
      const rawPayload = `tel:${normalized}`;
      return {
        valid: true,
        contentType,
        rawPayload,
        summary: `Call ${parsed.data.phone.trim()}`,
        byteLength: utf8ByteLength(rawPayload),
        errors: {},
      };
    }

    case 'sms': {
      const parsed = smsSchema.safeParse(forms.sms);
      if (!parsed.success) {
        return {
          valid: false,
          contentType,
          rawPayload: '',
          summary: 'Invalid SMS configuration',
          byteLength: 0,
          errors: issuesToErrorMap(parsed.error.issues),
        };
      }
      const normalized = normalizePhoneForUri(parsed.data.phone);
      const msg = parsed.data.message;
      const rawPayload = msg ? `SMSTO:${normalized}:${msg}` : `SMSTO:${normalized}`;
      return {
        valid: true,
        contentType,
        rawPayload,
        summary: `Send SMS to ${parsed.data.phone.trim()}${msg ? `: "${msg.slice(0, 48)}${msg.length > 48 ? '...' : ''}"` : ''}`,
        byteLength: utf8ByteLength(rawPayload),
        errors: {},
      };
    }

    case 'vcard': {
      const parsed = vcardSchema.safeParse(forms.vcard);
      if (!parsed.success) {
        return {
          valid: false,
          contentType,
          rawPayload: '',
          summary: 'Invalid contact card',
          byteLength: 0,
          errors: issuesToErrorMap(parsed.error.issues),
        };
      }
      const v = parsed.data;
      const fullName = [v.firstName, v.lastName].filter(Boolean).join(' ') || v.organization;
      const lines = [
        'BEGIN:VCARD',
        'VERSION:3.0',
        `N:${escapeVCardValue(v.lastName)};${escapeVCardValue(v.firstName)};;;`,
        `FN:${escapeVCardValue(fullName)}`,
      ];
      if (v.organization) lines.push(`ORG:${escapeVCardValue(v.organization)}`);
      if (v.title) lines.push(`TITLE:${escapeVCardValue(v.title)}`);
      if (v.phone) lines.push(`TEL;TYPE=CELL:${normalizePhoneForUri(v.phone)}`);
      if (v.email) lines.push(`EMAIL:${v.email}`);
      if (v.website) lines.push(`URL:${v.website}`);
      if (v.address) lines.push(`ADR;TYPE=WORK:;;${escapeVCardValue(v.address)};;;;`);
      lines.push('END:VCARD');

      const rawPayload = lines.join('\n');
      return {
        valid: true,
        contentType,
        rawPayload,
        summary: `Save contact: ${fullName}${v.organization && fullName !== v.organization ? ` (${v.organization})` : ''}`,
        byteLength: utf8ByteLength(rawPayload),
        errors: {},
      };
    }
  }
}
