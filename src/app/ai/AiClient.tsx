'use client';

import type { ChatThread, ChatMessage } from '@/types/database';
import {
  Clock3,
  Heart,
  MessageCircle,
  Plus,
  Send,
  Trash2,
} from 'lucide-react';
import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import Image from 'next/image';
import styles from './ai.module.css';

const PROMPTS = [
  'Mình muốn lắng nghe',
  'Hình như mình đang căng thẳng',
  'Mình muốn được an ủi',
];

function makeFallbackReply(input: string) {
  const lower = input.toLowerCase();

  if (lower.includes('bỏ') || lower.includes('chia tay') || lower.includes('người yêu')) {
    return 'Nghe như chuyện này đang chạm vào cảm giác mất mát và bị bỏ lại, nên buồn nhiều là điều rất dễ hiểu. Lúc này bạn không cần phải mạnh ngay; thử để mình ở cạnh cảm giác đó một chút, rồi kể mình nghe phần đau nhất là nhớ họ, hụt hẫng, hay thấy mình không đủ tốt?';
  }

  if (lower.includes('ngủ') || lower.includes('mệt')) {
    return 'Mình nghe thấy có vẻ cơ thể và tâm trí bạn đang cần được nghỉ. Thử đặt tên cho cảm giác đó trước, rồi mình cùng bạn chọn một việc nhỏ để nhẹ hơn.';
  }

  if (lower.includes('lo') || lower.includes('sợ') || lower.includes('áp lực')) {
    return 'Cảm giác lo lắng thường lớn hơn khi mình giữ một mình. Bạn có muốn kể điều đang làm bạn áp lực nhất ngay lúc này không?';
  }

  return `Mình nghe thấy điều bạn vừa nói: "${input.slice(0, 80)}". Có vẻ cảm xúc trong đó đang khá nặng, mình sẽ ở đây để nghe bạn nói chậm lại từng chút một.`;
}

function formatThreadTimestamp(value: string) {
  const date = new Date(value);
  const time = new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
  const day = new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);

  return `${time} · ${day}`;
}

type AiChatResponse = {
  reply?: string;
  error?: string;
};

function sleep(ms: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

type Props = {
  initialThreads: ChatThread[];
  initialMessages: ChatMessage[];
  isAuthenticated: boolean;
  userId: string | null;
};

export default function AiClient({
  initialThreads,
  initialMessages,
  isAuthenticated,
  userId,
}: Props) {
  const [threads, setThreads] = useState<ChatThread[]>(initialThreads);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(initialThreads[0]?.id ?? null);
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [draft, setDraft] = useState('');
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const supabase = createClient();

  const activeThread = useMemo(
    () => threads.find((t) => t.id === activeThreadId) ?? threads[0] ?? null,
    [activeThreadId, threads],
  );
  const hasUserMessage = messages.some((message) => message.role === 'user');
  const canStartNewThread = (!activeThread || hasUserMessage) && !isSending;

  // Load messages when switching threads
  useEffect(() => {
    if (!activeThreadId || !isAuthenticated) return;
    let cancelled = false;

    supabase
      .from('chat_messages')
      .select('*')
      .eq('thread_id', activeThreadId)
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        if (!cancelled && data) setMessages(data);
      });

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeThreadId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages]);

  const sendMessage = async (input: string) => {
    const text = input.trim();
    if (!text || !isAuthenticated || !userId || isSending) return;

    setIsSending(true);

    try {
      let targetThread = activeThread;
      const now = new Date().toISOString();
      const isFirstUserMessage = !targetThread || !messages.some((message) => message.role === 'user');

      if (!targetThread) {
        const { data } = await supabase
          .from('chat_threads')
          .insert({
            user_id: userId,
            title: text.slice(0, 34),
            topic: 'Em AI luôn ở đây',
          })
          .select()
          .single();

        if (!data) return;

        targetThread = data;
        setThreads((prev) => [data, ...prev]);
      }

      const history = messages
          .filter((message) => message.content.trim())
          // Load the full conversation history to provide context for the AI
          .map((message) => ({
            role: message.role,
            content: message.content,
          }));

      const userMsg: ChatMessage = {
        id: `temp-user-${now}`,
        thread_id: targetThread.id,
        role: 'user',
        content: text,
        created_at: now,
      };

      const assistantMsg: ChatMessage = {
        id: `temp-assistant-${now}`,
        thread_id: targetThread.id,
        role: 'assistant',
        content: '',
        created_at: now,
      };

      setMessages((prev) => [...prev, userMsg, assistantMsg]);
      setDraft('');

      let replyText = makeFallbackReply(text);

      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history }),
      });
      const payload = (await response.json().catch(() => ({}))) as AiChatResponse;
      if (!response.ok) {
        console.error('AI chat API error:', payload.error ?? response.statusText);
      }
      replyText = payload.reply?.trim() || replyText;

      const revealStep = replyText.length > 100 ? 3 : 2;
      for (let index = revealStep; index < replyText.length + revealStep; index += revealStep) {
        await sleep(18);
        const visibleReply = replyText.slice(0, index);
        setMessages((prev) =>
          prev.map((message) =>
            message.id === assistantMsg.id ? { ...message, content: visibleReply } : message,
          ),
        );
      }

      const threadUpdatedAt = new Date().toISOString();

      await supabase.from('chat_messages').insert([
        { thread_id: targetThread.id, role: 'user', content: text },
        { thread_id: targetThread.id, role: 'assistant', content: replyText },
      ]);

      const threadPatch = isFirstUserMessage
        ? { title: text.slice(0, 34), updated_at: threadUpdatedAt }
        : { updated_at: threadUpdatedAt };

      await supabase
        .from('chat_threads')
        .update(threadPatch)
        .eq('id', targetThread.id);

      setThreads((prev) =>
        prev.map((thread) =>
          thread.id === targetThread.id ? { ...thread, ...threadPatch } : thread,
        ),
      );
      setActiveThreadId(targetThread.id);
    } catch (error) {
      console.error('AI chat request failed:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await sendMessage(draft);
  };

  const startNewThread = async () => {
    if (!isAuthenticated || !userId || !canStartNewThread) return;

    const { data } = await supabase
      .from('chat_threads')
      .insert({
        user_id: userId,
        title: 'Cuộc trò chuyện mới',
        topic: 'Em AI luôn ở đây',
      })
      .select()
      .single();

    if (!data) return;

    // Insert welcome message
    const welcomeText = 'Mình ở đây với bạn. Bắt đầu từ một câu ngắn thôi: hôm nay trong lòng bạn đang có gì?';
    await supabase.from('chat_messages').insert({
      thread_id: data.id,
      role: 'assistant',
      content: welcomeText,
    });

    setThreads((prev) => [data, ...prev]);
    setActiveThreadId(data.id);
    const welcomeCreatedAt = new Date().toISOString();

    setMessages([{
      id: `welcome-${welcomeCreatedAt}`,
      thread_id: data.id,
      role: 'assistant',
      content: welcomeText,
      created_at: welcomeCreatedAt,
    }]);
    setIsHistoryOpen(false);
  };

  const clearHistory = async () => {
    if (!isAuthenticated || !userId) return;
    await supabase.from('chat_threads').delete().eq('user_id', userId);
    setThreads([]);
    setMessages([]);
    setActiveThreadId(null);
    setIsHistoryOpen(false);
  };

  const selectThread = (threadId: string) => {
    setActiveThreadId(threadId);
    setIsHistoryOpen(false);
  };

  // Show login prompt if not authenticated
  if (!isAuthenticated) {
    return (
      <section className={styles.page}>
        <div className={styles.workspace}>
          <main className={styles.chatPanel}>
            <div className={styles.botStage} aria-hidden="true">
              <div className={styles.botWrap}>
                <Image src="/images/ai-mascot-transparent.png" alt="AI Mascot" fill sizes="(max-width: 820px) 180px, 280px" style={{ objectFit: 'contain' }} priority />
              </div>
            </div>
            <div className={styles.chatStack}>
              <div className={styles.chatHeader}>
                <Heart size={18} fill="currentColor" />
                <div>
                  <strong>Em AI đồng hành</strong>
                  <span>Đăng nhập để bắt đầu trò chuyện</span>
                </div>
              </div>
              <div className={styles.messages}>
                <article className={`${styles.message} ${styles.assistantMessage}`}>
                  <p>Hãy đăng nhập để mình lưu lại cuộc trò chuyện và đồng hành cùng bạn nhé 💜</p>
                </article>
              </div>
            </div>
          </main>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.page}>
      <div className={styles.pageHeader}>
        <Heart size={18} fill="currentColor" className={styles.pageHeaderIcon} />
        <div>
          <strong>{activeThread?.title ?? 'Em AI'}</strong>
          <span>{activeThread?.topic ?? 'Chọn hoặc tạo cuộc trò chuyện mới'}</span>
        </div>
        <button
          type="button"
          className={styles.mobileHistoryButton}
          onClick={() => setIsHistoryOpen(true)}
          aria-label="Mở lịch sử chat"
          aria-expanded={isHistoryOpen}
        >
          <MessageCircle size={18} />
        </button>
      </div>

      <div className={styles.workspace}>
        <main className={`${styles.chatPanel} ${hasUserMessage ? styles.chatPanelActive : ''}`}>
          {!hasUserMessage && (
            <div className={styles.botStage} aria-hidden="true">
              <div className={styles.orbitDot} />
              <div className={styles.botWrap}>
                <Image src="/images/ai-mascot-transparent.png" alt="AI Mascot" fill sizes="(max-width: 820px) 180px, 280px" style={{ objectFit: 'contain' }} priority />
              </div>
            </div>
          )}

          <div className={styles.chatStack}>
            <div className={styles.chatHeaderPlaceholder}>
            </div>

            <div className={styles.messages} aria-live="polite" aria-busy={isSending}>
              {messages.map((message) => (
                <article
                  key={message.id}
                  className={`${styles.message} ${
                    message.role === 'user' ? styles.userMessage : styles.assistantMessage
                  }`}
                >
                  {message.role === 'assistant' && !message.content ? (
                    <p className={styles.typingIndicator} aria-label="Em AI đang soạn">
                      <span />
                      <span />
                      <span />
                    </p>
                  ) : (
                    <p>{message.content}</p>
                  )}
                  <time>
                    {new Intl.DateTimeFormat('vi-VN', {
                      hour: '2-digit',
                      minute: '2-digit',
                    }).format(new Date(message.created_at))}
                  </time>
                </article>
              ))}
              {messages.length === 0 && (
                <article className={`${styles.message} ${styles.assistantMessage}`}>
                  <p>Tạo cuộc trò chuyện mới để bắt đầu nhé 💜</p>
                </article>
              )}
              
              {!hasUserMessage && (
                <div className={styles.promptRow}>
                  {PROMPTS.map((prompt) => (
                    <button
                      type="button"
                      key={prompt}
                      onClick={() => void sendMessage(prompt)}
                      disabled={isSending}
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          </div>
        </main>

        {isHistoryOpen && (
          <button
            type="button"
            className={styles.historyBackdrop}
            onClick={() => setIsHistoryOpen(false)}
            aria-label="Đóng lịch sử chat"
          />
        )}

        <aside
          className={`${styles.historyPanel} ${isHistoryOpen ? styles.historyOpen : ''}`}
          aria-label="Lịch sử chat"
        >
          <div className={styles.historyHeader}>
            <div>
              <p>Lịch sử chat</p>
              <strong>{threads.length} cuộc trò chuyện</strong>
            </div>
            <div className={styles.historyActions}>
              <button
                type="button"
                className={styles.iconButton}
                onClick={startNewThread}
                aria-label="Tạo chat mới"
                disabled={!canStartNewThread}
              >
                <Plus size={18} />
              </button>
            </div>
          </div>

          <div className={styles.threadList}>
            {threads.map((thread) => (
              <button
                type="button"
                key={thread.id}
                className={`${styles.threadButton} ${
                  activeThreadId === thread.id ? styles.threadActive : ''
                }`}
                onClick={() => selectThread(thread.id)}
              >
                <MessageCircle size={16} />
                <span>
                  <strong>{thread.title}</strong>
                  <small>
                    <Clock3 size={12} />
                    {formatThreadTimestamp(thread.updated_at)}
                  </small>
                </span>
              </button>
            ))}
          </div>

          <button type="button" className={styles.clearButton} onClick={clearHistory}>
            <Trash2 size={16} />
            Xóa lịch sử
          </button>
        </aside>
      </div>


      <div className={styles.composerRow}>
        <form className={styles.composer} onSubmit={handleSubmit}>
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Nhắn cho Em AI..."
            aria-label="Tin nhắn cho Em AI"
            disabled={isSending}
          />
          <button type="submit" aria-label="Gửi tin nhắn" disabled={!draft.trim() || isSending}>
            <Send size={20} />
          </button>
        </form>
      </div>
    </section>
  );
}
