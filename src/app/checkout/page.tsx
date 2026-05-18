import Shell from '@/components/layout/Shell';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import CheckoutClient from './CheckoutClient';

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?message=${encodeURIComponent('Vui lòng đăng nhập để thanh toán')}`);
  }

  const { data: savedAddress } = await supabase
    .from('shipping_addresses')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  const { message } = await searchParams;

  return (
    <Shell>
      <CheckoutClient
        message={message}
        email={user.email ?? ''}
        emailConfirmed={Boolean(user.email_confirmed_at)}
        savedAddress={savedAddress}
      />
    </Shell>
  );
}
