import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_CONTENT_FORMS, type ContentFormsState } from '../schemas/payloadSchemas';
import { buildQrPayload, escapeWifiField } from './buildPayload';

function withForm<K extends keyof ContentFormsState>(
  key: K,
  value: Partial<ContentFormsState[K]>
): ContentFormsState {
  return {
    ...DEFAULT_CONTENT_FORMS,
    [key]: {
      ...DEFAULT_CONTENT_FORMS[key],
      ...value,
    },
  };
}

test('URL payload preserves exact destination URL without silent rewriting', () => {
  const exactUrl = 'https://Example.COM/Path/?utm_source=print&ref=A_1#top';
  const res = buildQrPayload('url', withForm('url', { url: exactUrl }));
  assert.equal(res.valid, true);
  assert.equal(res.rawPayload, exactUrl);
  assert.match(res.summary, /Example\.COM/);
});

test('URL payload rejects invalid URLs and missing protocol without rewriting', () => {
  const missingProto = buildQrPayload('url', withForm('url', { url: 'example.com' }));
  assert.equal(missingProto.valid, false);
  assert.ok(missingProto.errors.url);

  const ftpUrl = buildQrPayload('url', withForm('url', { url: 'ftp://files.example.com' }));
  assert.equal(ftpUrl.valid, false);

  const emptyUrl = buildQrPayload('url', withForm('url', { url: '   ' }));
  assert.equal(emptyUrl.valid, false);
});

test('Plain text payload supports unicode and special characters', () => {
  const unicode = 'Café Atelier — 日本語テスト ☕🎨';
  const res = buildQrPayload('text', withForm('text', { text: unicode }));
  assert.equal(res.valid, true);
  assert.equal(res.rawPayload, unicode);
  assert.ok(res.byteLength > unicode.length);
});

test('Wi-Fi payload escapes special characters and validates WPA password requirements', () => {
  assert.equal(escapeWifiField('My;Net:Work,"Test"\\'), 'My\\;Net\\:Work\\,\\"Test\\"\\\\');

  const res = buildQrPayload(
    'wifi',
    withForm('wifi', {
      ssid: 'Cafe;Guest',
      encryption: 'WPA',
      password: 'pass:word,123',
      hidden: true,
    })
  );
  assert.equal(res.valid, true);
  assert.equal(res.rawPayload, 'WIFI:T:WPA;S:Cafe\\;Guest;P:pass\\:word\\,123;H:true;;');

  const nopass = buildQrPayload(
    'wifi',
    withForm('wifi', { ssid: 'PublicLobby', encryption: 'nopass', password: '', hidden: false })
  );
  assert.equal(nopass.valid, true);
  assert.equal(nopass.rawPayload, 'WIFI:T:nopass;S:PublicLobby;;');

  const missingSsid = buildQrPayload('wifi', withForm('wifi', { ssid: '' }));
  assert.equal(missingSsid.valid, false);
  assert.ok(missingSsid.errors.ssid);

  const shortWpa = buildQrPayload('wifi', withForm('wifi', { encryption: 'WPA', password: '123' }));
  assert.equal(shortWpa.valid, false);
  assert.ok(shortWpa.errors.password);
});

test('Email, Phone, and SMS payloads format correctly and reject invalid inputs', () => {
  const email = buildQrPayload(
    'email',
    withForm('email', { address: 'hi@atelier.design', subject: 'Hello World', body: 'Line 1' })
  );
  assert.equal(email.valid, true);
  assert.equal(email.rawPayload, 'mailto:hi@atelier.design?subject=Hello%20World&body=Line%201');

  const badEmail = buildQrPayload('email', withForm('email', { address: 'not-an-email' }));
  assert.equal(badEmail.valid, false);
  assert.ok(badEmail.errors.address);

  const phone = buildQrPayload('phone', withForm('phone', { phone: '+1 (415) 555-0199' }));
  assert.equal(phone.valid, true);
  assert.equal(phone.rawPayload, 'tel:+14155550199');

  const sms = buildQrPayload('sms', withForm('sms', { phone: '+1 415 555 0100', message: 'Hi there' }));
  assert.equal(sms.valid, true);
  assert.equal(sms.rawPayload, 'SMSTO:+14155550100:Hi there');
});

test('vCard payload formats structured contact fields and requires identity', () => {
  const vcard = buildQrPayload('vcard', DEFAULT_CONTENT_FORMS);
  assert.equal(vcard.valid, true);
  assert.ok(vcard.rawPayload.startsWith('BEGIN:VCARD\nVERSION:3.0'));
  assert.ok(vcard.rawPayload.includes('N:Lin;Maya;;;'));
  assert.ok(vcard.rawPayload.includes('FN:Maya Lin'));
  assert.ok(vcard.rawPayload.includes('ORG:Northlight Studio'));
  assert.ok(vcard.rawPayload.endsWith('END:VCARD'));

  const emptyVcard = buildQrPayload(
    'vcard',
    withForm('vcard', { firstName: '', lastName: '', organization: '' })
  );
  assert.equal(emptyVcard.valid, false);
  assert.ok(emptyVcard.errors.firstName);
});
