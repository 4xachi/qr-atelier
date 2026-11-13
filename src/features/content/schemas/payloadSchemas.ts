import { z } from 'zod';

export const CONTENT_TYPES = [
  'url',
  'text',
  'wifi',
  'email',
  'phone',
  'sms',
  'vcard',
] as const;

export type ContentType = (typeof CONTENT_TYPES)[number];

export const urlSchema = z.object({
  url: z
    .string()
    .trim()
    .min(1, 'Enter a URL to encode.')
    .refine((val) => {
      if (/\s/.test(val)) return false;
      try {
        const parsed = new URL(val);
        return parsed.protocol === 'http:' || parsed.protocol === 'https:';
      } catch {
        return false;
      }
    }, 'Enter a valid http:// or https:// URL without spaces (we never silently rewrite your link).'),
});

export const textSchema = z.object({
  text: z
    .string()
    .min(1, 'Enter text content to encode.')
    .max(1800, 'Text is too long for reliable static QR scanning (max 1800 characters).'),
});

export const wifiSchema = z
  .object({
    ssid: z.string().min(1, 'Network name (SSID) is required.').max(64, 'SSID max length is 64 characters.'),
    encryption: z.enum(['WPA', 'WEP', 'nopass']),
    password: z.string().max(128, 'Password max length is 128 characters.'),
    hidden: z.boolean().default(false),
  })
  .superRefine((data, ctx) => {
    if (data.encryption !== 'nopass' && data.password.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Password is required for WPA/WEP networks.',
        path: ['password'],
      });
    }
    if (data.encryption === 'WPA' && data.password.length > 0 && data.password.length < 8) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'WPA/WPA2 passwords are normally at least 8 characters.',
        path: ['password'],
      });
    }
  });

export const emailSchema = z.object({
  address: z.string().trim().min(1, 'Email address is required.').email('Enter a valid email address.'),
  subject: z.string().max(200, 'Subject is too long (max 200 characters).').default(''),
  body: z.string().max(1000, 'Body is too long (max 1000 characters).').default(''),
});

export const phoneSchema = z.object({
  phone: z
    .string()
    .trim()
    .min(1, 'Phone number is required.')
    .refine((val) => /^\+?[0-9\s\-().]{5,24}$/.test(val), 'Enter a valid phone number (digits, +, spaces, hyphens, parentheses).'),
});

export const smsSchema = z.object({
  phone: z
    .string()
    .trim()
    .min(1, 'Recipient phone number is required.')
    .refine((val) => /^\+?[0-9\s\-().]{5,24}$/.test(val), 'Enter a valid phone number.'),
  message: z.string().max(500, 'SMS message max length is 500 characters.').default(''),
});

export const vcardSchema = z
  .object({
    firstName: z.string().trim().max(80).default(''),
    lastName: z.string().trim().max(80).default(''),
    organization: z.string().trim().max(100).default(''),
    title: z.string().trim().max(100).default(''),
    phone: z
      .string()
      .trim()
      .refine((val) => val === '' || /^\+?[0-9\s\-().]{5,24}$/.test(val), 'Enter a valid phone number.')
      .default(''),
    email: z
      .string()
      .trim()
      .refine((val) => val === '' || z.string().email().safeParse(val).success, 'Enter a valid email address.')
      .default(''),
    website: z
      .string()
      .trim()
      .refine((val) => {
        if (val === '') return true;
        try {
          const u = new URL(val);
          return u.protocol === 'http:' || u.protocol === 'https:';
        } catch {
          return false;
        }
      }, 'Enter a valid http:// or https:// website URL.')
      .default(''),
    address: z.string().trim().max(200).default(''),
  })
  .superRefine((data, ctx) => {
    if (!data.firstName && !data.lastName && !data.organization) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Provide at least a first name, last name, or organization.',
        path: ['firstName'],
      });
    }
  });

export type UrlContentInput = z.infer<typeof urlSchema>;
export type TextContentInput = z.infer<typeof textSchema>;
export type WifiContentInput = z.infer<typeof wifiSchema>;
export type EmailContentInput = z.infer<typeof emailSchema>;
export type PhoneContentInput = z.infer<typeof phoneSchema>;
export type SmsContentInput = z.infer<typeof smsSchema>;
export type VCardContentInput = z.infer<typeof vcardSchema>;

export interface ContentFormsState {
  url: UrlContentInput;
  text: TextContentInput;
  wifi: WifiContentInput;
  email: EmailContentInput;
  phone: PhoneContentInput;
  sms: SmsContentInput;
  vcard: VCardContentInput;
}

export const DEFAULT_CONTENT_FORMS: ContentFormsState = {
  url: {
    url: 'https://qratelier.design',
  },
  text: {
    text: 'QR Atelier — Crafted locally in your browser.',
  },
  wifi: {
    ssid: 'AtelierGuest',
    encryption: 'WPA',
    password: 'studio-coffee-2026',
    hidden: false,
  },
  email: {
    address: 'hello@studio.example',
    subject: 'Project Inquiry',
    body: 'Hello, I scanned your studio QR card.',
  },
  phone: {
    phone: '+1 415 555 0199',
  },
  sms: {
    phone: '+1 415 555 0199',
    message: 'Hi! Checking in from the event.',
  },
  vcard: {
    firstName: 'Maya',
    lastName: 'Lin',
    organization: 'Northlight Studio',
    title: 'Creative Director',
    phone: '+1 415 555 0142',
    email: 'maya@northlight.example',
    website: 'https://northlight.example',
    address: '420 Brannan St, San Francisco, CA',
  },
};

export interface QrPayloadResult {
  valid: boolean;
  contentType: ContentType;
  rawPayload: string;
  summary: string;
  byteLength: number;
  errors: Record<string, string>;
}
