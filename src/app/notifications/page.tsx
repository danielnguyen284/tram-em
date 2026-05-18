import Shell from '@/components/layout/Shell';
import { getNotifications } from '@/lib/supabase/notifications';
import { createClient } from '@/utils/supabase/server';
import NotificationsClient from './NotificationsClient';

export const dynamic = 'force-dynamic';

export default async function NotificationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const notifications = user ? await getNotifications() : [];

  return (
    <Shell>
      <NotificationsClient notifications={notifications} isAuthenticated={!!user} />
    </Shell>
  );
}
