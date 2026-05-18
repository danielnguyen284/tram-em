import crypto from 'crypto';

const PAYMENT_TTL_MINUTES = 15;

export type SepayWebhookPayload = {
  id: number;
  gateway: string;
  transactionDate: string;
  accountNumber: string;
  subAccount: string;
  code: string | null;
  content: string;
  transferType: 'in' | 'out';
  description: string;
  transferAmount: number;
  accumulated: number;
  referenceCode: string;
};

export function getSepayPaymentPrefix() {
  return process.env.SEPAY_PAYMENT_PREFIX?.trim() || 'TRM';
}

export function createPaymentCode(orderId: string) {
  const compactId = orderId.replace(/-/g, '').slice(0, 12).toUpperCase();
  return `${getSepayPaymentPrefix()}${compactId}`;
}

export function getPaymentExpiryDate() {
  return new Date(Date.now() + PAYMENT_TTL_MINUTES * 60 * 1000);
}

export function buildSepayQrUrl(input: { amount: number; description: string }) {
  const bank = process.env.SEPAY_BANK_CODE?.trim();
  const account = process.env.SEPAY_ACCOUNT_NUMBER?.trim();

  if (!bank || !account) {
    return null;
  }

  const params = new URLSearchParams({
    acc: account,
    bank,
    amount: String(input.amount),
    des: input.description,
  });

  return `https://qr.sepay.vn/img?${params.toString()}`;
}

export function verifySepaySignature(input: {
  rawBody: string;
  signature: string | null;
  timestamp: string | null;
  secret: string;
}) {
  const timestampNumber = Number(input.timestamp);
  if (!input.signature || !Number.isFinite(timestampNumber)) {
    return false;
  }

  const nowSeconds = Math.floor(Date.now() / 1000);
  if (Math.abs(nowSeconds - timestampNumber) > 300) {
    return false;
  }

  const expected = `sha256=${crypto
    .createHmac('sha256', input.secret)
    .update(`${input.timestamp}.${input.rawBody}`)
    .digest('hex')}`;

  const actualBuffer = Buffer.from(input.signature);
  const expectedBuffer = Buffer.from(expected);

  return (
    actualBuffer.length === expectedBuffer.length &&
    crypto.timingSafeEqual(actualBuffer, expectedBuffer)
  );
}

export function isSepayWebhookPayload(value: unknown): value is SepayWebhookPayload {
  const payload = value as Partial<SepayWebhookPayload>;

  return (
    typeof payload.id === 'number' &&
    typeof payload.gateway === 'string' &&
    typeof payload.transactionDate === 'string' &&
    typeof payload.accountNumber === 'string' &&
    (typeof payload.code === 'string' || payload.code === null) &&
    typeof payload.content === 'string' &&
    (payload.transferType === 'in' || payload.transferType === 'out') &&
    typeof payload.transferAmount === 'number' &&
    typeof payload.referenceCode === 'string'
  );
}
