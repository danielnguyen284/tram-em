import { createClient } from '@/utils/supabase/server';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: order, error } = await supabase
    .from('orders')
    .select('id, payment_status, payment_amount, payment_reference, paid_at, expires_at')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle();

  if (error || !order) {
    return Response.json({ error: 'Not found' }, { status: 404 });
  }

  const inferredStatus =
    order.payment_status === 'pending' &&
    order.expires_at &&
    new Date(order.expires_at).getTime() < Date.now()
      ? 'expired'
      : order.payment_status;

  return Response.json({
    payment_status: inferredStatus,
    payment_amount: order.payment_amount,
    payment_reference: order.payment_reference,
    paid_at: order.paid_at,
    expires_at: order.expires_at,
  });
}
