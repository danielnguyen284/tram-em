import type { ChatThread, ChatMessage } from '@/types/database';
import { createClient } from '@/utils/supabase/server';

export async function getThreads(): Promise<ChatThread[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('chat_threads')
    .select('*')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false });

  if (error) return [];
  return data ?? [];
}

export async function getMessages(threadId: string): Promise<ChatMessage[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('thread_id', threadId)
    .order('created_at', { ascending: true });

  if (error) return [];
  return data ?? [];
}

export async function createThread(title?: string, topic?: string): Promise<ChatThread | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('chat_threads')
    .insert({
      user_id: user.id,
      title: title ?? 'Cuộc trò chuyện mới',
      topic: topic ?? 'Em AI luôn ở đây',
    })
    .select()
    .single();

  if (error) return null;
  return data;
}

export async function sendMessage(
  threadId: string,
  role: 'user' | 'assistant',
  content: string,
): Promise<ChatMessage | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('chat_messages')
    .insert({ thread_id: threadId, role, content })
    .select()
    .single();

  if (error) return null;

  // Update thread's updated_at
  await supabase
    .from('chat_threads')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', threadId);

  return data;
}

export async function updateThreadTitle(threadId: string, title: string) {
  const supabase = await createClient();
  await supabase
    .from('chat_threads')
    .update({ title })
    .eq('id', threadId);
}

export async function deleteThread(threadId: string) {
  const supabase = await createClient();
  await supabase
    .from('chat_threads')
    .delete()
    .eq('id', threadId);
}
