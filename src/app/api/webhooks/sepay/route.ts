import { createAdminSupabaseClient } from '@/lib/admin/supabase';
import {
  isSepayWebhookPayload,
  verifySepaySignature,
  type SepayWebhookPayload,
} from '@/lib/sepay';

export const runtime = 'nodejs';

function success() {
  return Response.json({ success: true });
}

function failure(message: string, status = 400) {
  return Response.json({ success: false, message }, { status });
}

function transactionRow(payload: SepayWebhookPayload, orderId: string | null) {
  return {
    sepay_transaction_id: payload.id,
    order_id: orderId,
    gateway: payload.gateway,
    transaction_date: payload.transactionDate,
    account_number: payload.accountNumber,
    sub_account: payload.subAccount,
    payment_code: payload.code,
    content: payload.content,
    transfer_type: payload.transferType,
    description: payload.description,
    transfer_amount: payload.transferAmount,
    accumulated: payload.accumulated ?? 0,
    reference_code: payload.referenceCode,
    raw_payload: payload as unknown as Record<string, unknown>,
  };
}

export async function POST(request: Request) {
  const secret = process.env.SEPAY_WEBHOOK_SECRET;
  if (!secret || secret.includes('your-webhook-secret')) {
    return failure('Missing webhook secret', 500);
  }

  const rawBody = await request.text();
  const isVerified = verifySepaySignature({
    rawBody,
    secret,
    signature: request.headers.get('x-sepay-signature'),
    timestamp: request.headers.get('x-sepay-timestamp'),
  });

  if (!isVerified) {
    return failure('Invalid signature', 401);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawBody);
  } catch {
    return failure('Invalid JSON');
  }

  if (!isSepayWebhookPayload(parsed)) {
    return failure('Invalid payload');
  }

  const payload = parsed;
  const supabase = createAdminSupabaseClient();

  if (payload.transferType !== 'in' || !payload.code) {
    await supabase.from('sepay_transactions').insert(transactionRow(payload, null));
    return success();
  }

  const { data: order } = await supabase
    .from('orders')
    .select('id, total, payment_status')
    .eq('payment_code', payload.code)
    .maybeSingle();

  const { error: transactionError } = await supabase
    .from('sepay_transactions')
    .insert(transactionRow(payload, order?.id ?? null));

  if (transactionError) {
    const code = (transactionError as { code?: string }).code;
    if (code === '23505') {
      return success();
    }

    return failure('Cannot record transaction', 500);
  }

  if (!order) {
    return success();
  }

  const paymentUpdate =
    payload.transferAmount >= order.total
      ? {
          payment_status: 'paid',
          payment_amount: payload.transferAmount,
          payment_reference: payload.referenceCode,
          paid_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
      : {
          payment_status: 'manual_review',
          payment_amount: payload.transferAmount,
          payment_reference: payload.referenceCode,
          updated_at: new Date().toISOString(),
        };

  await supabase
    .from('orders')
    .update(paymentUpdate)
    .eq('id', order.id)
    .neq('payment_status', 'paid');

  return success();
}
