'use client';

import type { ChatThread, ChatMessage } from '@/types/database';
import {
  Bot,
  Clock3,
  Heart,
  MessageCircle,
  Plus,
  Send,
  Trash2,
  X,
} from 'lucide-react';
import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import styles from './ai.module.css';

const TOPICS = [
  'Hỏi đáp về sức khỏe tâm lý',
  'Trò chuyện ẩn danh',
  'Trò chuyện trước khi ngủ',
];

const PROMPTS = [
  'Mình muốn lắng nghe',
  'Hình như mình đang căng thẳng',
  'Mình muốn được an ủi',
];

function makeReply(input: string) {
  const lower = input.toLowerCase();

  if (lower.includes('ngủ') || lower.includes('mệt')) {
    return 'Mình nghe thấy có vẻ cơ thể và tâm trí bạn đang cần được nghỉ. Thử đặt tên cho cảm giác đó trước, rồi mình cùng bạn chọn một việc nhỏ để nhẹ hơn.';
  }

  if (lower.includes('lo') || lower.includes('sợ') || lower.includes('áp lực')) {
    return 'Cảm giác lo lắng thường lớn hơn khi mình giữ một mình. Bạn có muốn kể điều đang làm bạn áp lực nhất ngay lúc này không?';
  }

  return 'Mình đang lắng nghe bạn. Hãy kể thêm một chút về chuyện đó, hoặc chọn một hướng bên dưới để mình đồng hành tiếp.';
}

function timeLabel() {
  return new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date());
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
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const supabase = createClient();

  const activeThread = useMemo(
    () => threads.find((t) => t.id === activeThreadId) ?? threads[0] ?? null,
    [activeThreadId, threads],
  );

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

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const text = draft.trim();
    if (!text || !activeThread || !isAuthenticated) return;

    const now = new Date().toISOString();

    // Optimistic user message
    const userMsg: ChatMessage = {
      id: `temp-user-${Date.now()}`,
      thread_id: activeThread.id,
      role: 'user',
      content: text,
      created_at: now,
    };

    const replyText = makeReply(text);
    const assistantMsg: ChatMessage = {
      id: `temp-assistant-${Date.now()}`,
      thread_id: activeThread.id,
      role: 'assistant',
      content: replyText,
      created_at: now,
    };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setDraft('');

    // Persist to DB
    await supabase.from('chat_messages').insert([
      { thread_id: activeThread.id, role: 'user', content: text },
      { thread_id: activeThread.id, role: 'assistant', content: replyText },
    ]);

    // Update thread title if first user message
    if (messages.length <= 1) {
      const title = text.slice(0, 34);
      await supabase
        .from('chat_threads')
        .update({ title, updated_at: now })
        .eq('id', activeThread.id);
      setThreads((prev) =>
        prev.map((t) => (t.id === activeThread.id ? { ...t, title, updated_at: now } : t)),
      );
    }
  };

  const startNewThread = async () => {
    if (!isAuthenticated || !userId) return;

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
    setMessages([{
      id: `welcome-${Date.now()}`,
      thread_id: data.id,
      role: 'assistant',
      content: welcomeText,
      created_at: new Date().toISOString(),
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
                <div className={styles.botHead}>
                  <span className={styles.botEye} />
                  <span className={styles.botSmile} />
                  <span className={styles.botEye} />
                </div>
                <div className={styles.botBody}>
                  <Bot size={28} />
                </div>
              </div>
            </div>
            <div className={styles.chatStack}>
              <div className={styles.modeCard}>
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
      <div className={styles.workspace}>
        <main className={styles.chatPanel}>
          <div className={styles.botStage} aria-hidden="true">
            <div className={styles.orbitDot} />
            <div className={styles.botWrap}>
              <div className={styles.botHead}>
                <span className={styles.botEye} />
                <span className={styles.botSmile} />
                <span className={styles.botEye} />
              </div>
              <div className={styles.botBody}>
                <Bot size={28} />
              </div>
            </div>
          </div>

          <div className={styles.chatStack}>
            <div className={styles.modeCard}>
              <Heart size={18} fill="currentColor" />
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

            <div className={styles.messages} aria-live="polite">
              {messages.map((message) => (
                <article
                  key={message.id}
                  className={`${styles.message} ${
                    message.role === 'user' ? styles.userMessage : styles.assistantMessage
                  }`}
                >
                  <p>{message.content}</p>
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
              <button type="button" className={styles.iconButton} onClick={startNewThread} aria-label="Tạo chat mới">
                <Plus size={18} />
              </button>
              <button
                type="button"
                className={`${styles.iconButton} ${styles.closeHistoryButton}`}
                onClick={() => setIsHistoryOpen(false)}
                aria-label="Đóng lịch sử chat"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          <div className={styles.topicList}>
            {TOPICS.map((topic) => (
              <button
                type="button"
                key={topic}
                className={styles.topicButton}
                onClick={() => setDraft(topic)}
              >
                {topic}
              </button>
            ))}
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
                    {new Intl.DateTimeFormat('vi-VN', {
                      hour: '2-digit',
                      minute: '2-digit',
                    }).format(new Date(thread.updated_at))}
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

      <div className={styles.promptRow}>
        {PROMPTS.map((prompt) => (
          <button type="button" key={prompt} onClick={() => setDraft(prompt)}>
            {prompt}
          </button>
        ))}
      </div>

      <form className={styles.composer} onSubmit={handleSubmit}>
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Nhắn cho Em AI..."
          aria-label="Tin nhắn cho Em AI"
        />
        <button type="submit" aria-label="Gửi tin nhắn" disabled={!draft.trim()}>
          <Send size={20} />
        </button>
      </form>
    </section>
  );
}
