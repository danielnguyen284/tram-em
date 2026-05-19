import Shell from '@/components/layout/Shell';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import SecurityClient from './SecurityClient';

export const dynamic = 'force-dynamic';

export default async function AccountSecurityPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, phone, gender, username, address, email')
    .eq('id', user.id)
    .maybeSingle();

  return (
    <Shell>
      <SecurityClient initialProfile={profile} userEmail={user.email || ''} />
    </Shell>
  );
}
