import {
  Link2,
  Type,
  Wifi,
  Mail,
  Phone,
  MessageSquare,
  Contact,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import type { ContentType } from '../schemas/payloadSchemas';
import { useAtelierStore } from '../../editor/state/useAtelierStore';

const CONTENT_TABS: { id: ContentType; label: string; icon: typeof Link2 }[] = [
  { id: 'url', label: 'URL', icon: Link2 },
  { id: 'text', label: 'Text', icon: Type },
  { id: 'wifi', label: 'Wi-Fi', icon: Wifi },
  { id: 'email', label: 'Email', icon: Mail },
  { id: 'phone', label: 'Phone', icon: Phone },
  { id: 'sms', label: 'SMS', icon: MessageSquare },
  { id: 'vcard', label: 'vCard', icon: Contact },
];

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="mt-1 flex items-center gap-1 text-xs font-medium text-red-700">
      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
      <span>{message}</span>
    </p>
  );
}

export function ContentBuilderPanel() {
  const contentType = useAtelierStore((s) => s.contentType);
  const forms = useAtelierStore((s) => s.contentForms);
  const payloadResult = useAtelierStore((s) => s.payloadResult);
  const setContentType = useAtelierStore((s) => s.setContentType);
  const updateContentField = useAtelierStore((s) => s.updateContentField);

  const errors = payloadResult.errors;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-sm font-semibold text-slate-900">
          Content Type
        </h2>
        <div
          role="tablist"
          aria-label="QR content type"
          className="mt-2.5 grid grid-cols-4 gap-1.5"
        >
          {CONTENT_TABS.map((tab) => {
            const Icon = tab.icon;
            const active = contentType === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setContentType(tab.id)}
                className={`flex items-center justify-center gap-1.5 rounded-lg border px-2 py-2 text-xs font-medium transition-colors whitespace-nowrap ${
                  active
                    ? 'border-teal-700 bg-teal-700 text-white'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="border-t border-slate-200 pt-4">
        {contentType === 'url' && (
          <div>
            <label htmlFor="qr-url-input" className="block text-xs font-semibold text-slate-800">
              Destination URL
            </label>
            <input
              id="qr-url-input"
              type="url"
              value={forms.url.url}
              onChange={(e) => updateContentField('url', { url: e.target.value })}
              placeholder="https://yourbrand.com/menu"
              className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-700 focus:outline-none"
            />
            <FieldError message={errors.url} />
            <p className="mt-1.5 text-[11px] text-slate-500">
              Encoded verbatim. We never shorten, track, or silently rewrite your URL.
            </p>
          </div>
        )}

        {contentType === 'text' && (
          <div>
            <label htmlFor="qr-text-input" className="block text-xs font-semibold text-slate-800">
              Plain Text Content
            </label>
            <textarea
              id="qr-text-input"
              rows={4}
              value={forms.text.text}
              onChange={(e) => updateContentField('text', { text: e.target.value })}
              placeholder="Enter text, serial number, or instructions..."
              className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-700 focus:outline-none"
            />
            <FieldError message={errors.text} />
          </div>
        )}

        {contentType === 'wifi' && (
          <div className="space-y-3">
            <div>
              <label htmlFor="qr-wifi-ssid" className="block text-xs font-semibold text-slate-800">
                Network Name (SSID)
              </label>
              <input
                id="qr-wifi-ssid"
                type="text"
                value={forms.wifi.ssid}
                onChange={(e) => updateContentField('wifi', { ssid: e.target.value })}
                placeholder="AtelierGuest"
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-teal-700 focus:outline-none"
              />
              <FieldError message={errors.ssid} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="qr-wifi-enc" className="block text-xs font-semibold text-slate-800">
                  Security
                </label>
                <select
                  id="qr-wifi-enc"
                  value={forms.wifi.encryption}
                  onChange={(e) =>
                    updateContentField('wifi', {
                      encryption: e.target.value as 'WPA' | 'WEP' | 'nopass',
                    })
                  }
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-sm text-slate-900 focus:border-teal-700 focus:outline-none"
                >
                  <option value="WPA">WPA / WPA2</option>
                  <option value="WEP">WEP</option>
                  <option value="nopass">No Password</option>
                </select>
              </div>

              <div className="flex items-end pb-2">
                <label className="flex items-center gap-2 text-xs font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={forms.wifi.hidden}
                    onChange={(e) => updateContentField('wifi', { hidden: e.target.checked })}
                    className="h-4 w-4 rounded border-slate-300 text-teal-700 focus:ring-teal-700"
                  />
                  <span>Hidden network</span>
                </label>
              </div>
            </div>

            {forms.wifi.encryption !== 'nopass' && (
              <div>
                <label htmlFor="qr-wifi-pass" className="block text-xs font-semibold text-slate-800">
                  Wi-Fi Password
                </label>
                <input
                  id="qr-wifi-pass"
                  type="text"
                  value={forms.wifi.password}
                  onChange={(e) => updateContentField('wifi', { password: e.target.value })}
                  placeholder="Enter network password"
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-teal-700 focus:outline-none"
                />
                <FieldError message={errors.password} />
              </div>
            )}
          </div>
        )}

        {contentType === 'email' && (
          <div className="space-y-3">
            <div>
              <label htmlFor="qr-email-addr" className="block text-xs font-semibold text-slate-800">
                Recipient Email
              </label>
              <input
                id="qr-email-addr"
                type="email"
                value={forms.email.address}
                onChange={(e) => updateContentField('email', { address: e.target.value })}
                placeholder="hello@company.com"
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-teal-700 focus:outline-none"
              />
              <FieldError message={errors.address} />
            </div>
            <div>
              <label htmlFor="qr-email-subj" className="block text-xs font-semibold text-slate-800">
                Subject (optional)
              </label>
              <input
                id="qr-email-subj"
                type="text"
                value={forms.email.subject}
                onChange={(e) => updateContentField('email', { subject: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-teal-700 focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="qr-email-body" className="block text-xs font-semibold text-slate-800">
                Message Body (optional)
              </label>
              <textarea
                id="qr-email-body"
                rows={3}
                value={forms.email.body}
                onChange={(e) => updateContentField('email', { body: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-teal-700 focus:outline-none"
              />
            </div>
          </div>
        )}

        {contentType === 'phone' && (
          <div>
            <label htmlFor="qr-phone-num" className="block text-xs font-semibold text-slate-800">
              Phone Number
            </label>
            <input
              id="qr-phone-num"
              type="tel"
              value={forms.phone.phone}
              onChange={(e) => updateContentField('phone', { phone: e.target.value })}
              placeholder="+1 415 555 0199"
              className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-teal-700 focus:outline-none"
            />
            <FieldError message={errors.phone} />
          </div>
        )}

        {contentType === 'sms' && (
          <div className="space-y-3">
            <div>
              <label htmlFor="qr-sms-num" className="block text-xs font-semibold text-slate-800">
                Recipient Phone
              </label>
              <input
                id="qr-sms-num"
                type="tel"
                value={forms.sms.phone}
                onChange={(e) => updateContentField('sms', { phone: e.target.value })}
                placeholder="+1 415 555 0199"
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-teal-700 focus:outline-none"
              />
              <FieldError message={errors.phone} />
            </div>
            <div>
              <label htmlFor="qr-sms-msg" className="block text-xs font-semibold text-slate-800">
                Pre-filled Message (optional)
              </label>
              <textarea
                id="qr-sms-msg"
                rows={3}
                value={forms.sms.message}
                onChange={(e) => updateContentField('sms', { message: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-teal-700 focus:outline-none"
              />
              <FieldError message={errors.message} />
            </div>
          </div>
        )}

        {contentType === 'vcard' && (
          <div className="space-y-2.5">
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label htmlFor="qr-vc-first" className="block text-xs font-semibold text-slate-800">
                  First Name
                </label>
                <input
                  id="qr-vc-first"
                  type="text"
                  value={forms.vcard.firstName}
                  onChange={(e) => updateContentField('vcard', { firstName: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-900 focus:border-teal-700 focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="qr-vc-last" className="block text-xs font-semibold text-slate-800">
                  Last Name
                </label>
                <input
                  id="qr-vc-last"
                  type="text"
                  value={forms.vcard.lastName}
                  onChange={(e) => updateContentField('vcard', { lastName: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-900 focus:border-teal-700 focus:outline-none"
                />
              </div>
            </div>
            <FieldError message={errors.firstName} />

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label htmlFor="qr-vc-org" className="block text-xs font-semibold text-slate-800">
                  Organization
                </label>
                <input
                  id="qr-vc-org"
                  type="text"
                  value={forms.vcard.organization}
                  onChange={(e) => updateContentField('vcard', { organization: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-900 focus:border-teal-700 focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="qr-vc-title" className="block text-xs font-semibold text-slate-800">
                  Role / Title
                </label>
                <input
                  id="qr-vc-title"
                  type="text"
                  value={forms.vcard.title}
                  onChange={(e) => updateContentField('vcard', { title: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-900 focus:border-teal-700 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label htmlFor="qr-vc-phone" className="block text-xs font-semibold text-slate-800">
                  Phone
                </label>
                <input
                  id="qr-vc-phone"
                  type="tel"
                  value={forms.vcard.phone}
                  onChange={(e) => updateContentField('vcard', { phone: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-900 focus:border-teal-700 focus:outline-none"
                />
                <FieldError message={errors.phone} />
              </div>
              <div>
                <label htmlFor="qr-vc-email" className="block text-xs font-semibold text-slate-800">
                  Email
                </label>
                <input
                  id="qr-vc-email"
                  type="email"
                  value={forms.vcard.email}
                  onChange={(e) => updateContentField('vcard', { email: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-900 focus:border-teal-700 focus:outline-none"
                />
                <FieldError message={errors.email} />
              </div>
            </div>

            <div>
              <label htmlFor="qr-vc-web" className="block text-xs font-semibold text-slate-800">
                Website
              </label>
              <input
                id="qr-vc-web"
                type="url"
                value={forms.vcard.website}
                onChange={(e) => updateContentField('vcard', { website: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-900 focus:border-teal-700 focus:outline-none"
              />
              <FieldError message={errors.website} />
            </div>

            <div>
              <label htmlFor="qr-vc-addr" className="block text-xs font-semibold text-slate-800">
                Address
              </label>
              <input
                id="qr-vc-addr"
                type="text"
                value={forms.vcard.address}
                onChange={(e) => updateContentField('vcard', { address: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-900 focus:border-teal-700 focus:outline-none"
              />
            </div>
          </div>
        )}
      </div>

      {/* Readable Payload Summary & Exact Encoded String (FR-01) */}
      <div className="border-t border-slate-200 pt-4">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold text-slate-800">Payload Summary</span>
          <span className="font-mono text-[11px] text-slate-500 tabular-nums">
            {payloadResult.byteLength} bytes
          </span>
        </div>

        <div
          data-testid="payload-summary"
          className={`mt-2 rounded-lg border p-3 ${
            payloadResult.valid
              ? 'border-slate-200 bg-slate-50'
              : 'border-red-200 bg-red-50'
          }`}
        >
          <div className="flex items-start gap-2">
            {payloadResult.valid ? (
              <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-teal-700" />
            ) : (
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-700" />
            )}
            <p className="text-xs font-medium text-slate-800">{payloadResult.summary}</p>
          </div>

          {payloadResult.valid && (
            <pre
              data-testid="exact-payload-preview"
              className="mt-2 max-h-24 overflow-auto rounded border border-slate-200 bg-white p-2 font-mono text-[11px] leading-relaxed text-slate-700 break-all whitespace-pre-wrap"
            >
              {payloadResult.rawPayload}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}
