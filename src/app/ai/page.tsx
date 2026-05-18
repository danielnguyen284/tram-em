import Shell from '@/components/layout/Shell';
import { getThreads, getMessages } from '@/lib/supabase/chat';
import { createClient } from '@/utils/supabase/server';
import AiClient from './AiClient';

export const dynamic = 'force-dynamic';

export default async function AiPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let threads: Awaited<ReturnType<typeof getThreads>> = [];
  let initialMessages: Awaited<ReturnType<typeof getMessages>> = [];

  if (user) {
    threads = await getThreads();
    if (threads.length > 0) {
      initialMessages = await getMessages(threads[0].id);
    }
  }

  return (
    <Shell>
      <AiClient
        initialThreads={threads}
        initialMessages={initialMessages}
        isAuthenticated={!!user}
        userId={user?.id ?? null}
      />
    </Shell>
  );
}
