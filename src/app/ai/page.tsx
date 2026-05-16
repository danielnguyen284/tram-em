'use client';

import Shell from '@/components/layout/Shell';
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
import styles from './ai.module.css';

type ChatRole = 'assistant' | 'user';

type ChatMessage = {
  id: string;
  role: ChatRole;
  text: string;
  time: string;
};

type ChatThread = {
  id: string;
  title: string;
  topic: string;
  updatedAt: number;
  messages: ChatMessage[];
};

const STORAGE_KEY = 'tramem-ai-chat-history-v1';

const DEFAULT_THREADS: ChatThread[] = [
  {
    id: 'soft-checkin',
    title: 'Hoi dap ve suc khoe tam ly',
    topic: 'Tro chuyen cung Em AI',
    updatedAt: 1_768_500_000_000,
    messages: [
      {
        id: 'welcome-1',
        role: 'assistant',
        text: 'Chao ban, minh o day de lang nghe. Hom nay ban muon ke cho minh nghe dieu gi?',
        time: '09:20',
      },
      {
        id: 'welcome-2',
        role: 'user',
        text: 'Minh thay hoi met va kho tap trung.',
        time: '09:21',
      },
      {
        id: 'welcome-3',
        role: 'assistant',
        text: 'Cam on ban da noi ra. Minh se di tung chut mot voi ban: luc nay co dieu gi lam ban nang long nhat?',
        time: '09:21',
      },
    ],
  },
  {
    id: 'quiet-talk',
    title: 'Tro chuyen an danh',
    topic: 'Khong gian rieng tu',
    updatedAt: 1_768_410_000_000,
    messages: [
      {
        id: 'quiet-1',
        role: 'assistant',
        text: 'Ban co the chia se theo cach minh thay an toan. Minh se khong voi vang ket luan.',
        time: '21:08',
      },
    ],
  },
  {
    id: 'sleep-care',
    title: 'Tro chuyen truoc khi ngu',
    topic: 'Giu nhip tho cham',
    updatedAt: 1_768_070_000_000,
    messages: [
      {
        id: 'sleep-1',
        role: 'assistant',
        text: 'Neu dem nay kho ngu, minh co the cung ban sap xep lai suy nghi trong vai phut.',
        time: '22:15',
      },
    ],
  },
];

const TOPICS = [
  'Hoi dap ve suc khoe tam ly',
  'Tro chuyen an danh',
  'Tro chuyen kinh ti',
  'Tro chuyen can tuong',
  'Tro chuyen truoc khi ngu',
  'Tro chuyen thiet che',
];

const PROMPTS = [
  'Minh muon lang gien',
  'Hinh suc ve trong dinh',
  'Minh muoc con ca nhan',
];

function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.round(Math.random() * 10000)}`;
}

function timeLabel() {
  return new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date());
}

function makeReply(input: string) {
  const lower = input.toLowerCase();

  if (lower.includes('ngu') || lower.includes('met')) {
    return 'Minh nghe thay co ve co the va tam tri ban dang can duoc nghi. Thu dat ten cho cam giac do truoc, roi minh cung ban chon mot viec nho de nhe hon.';
  }

  if (lower.includes('lo') || lower.includes('so') || lower.includes('ap luc')) {
    return 'Cam giac lo lang thuong lon hon khi minh giu mot minh. Ban co muon ke dieu dang lam ban ap luc nhat ngay luc nay khong?';
  }

  return 'Minh dang lang nghe ban. Hay ke them mot chut ve chuyen do, hoac chon mot huong ben duoi de minh dong hanh tiep.';
}

function loadThreads() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_THREADS;

    const parsed = JSON.parse(raw) as ChatThread[];
    if (!Array.isArray(parsed) || parsed.length === 0) return DEFAULT_THREADS;

    return parsed;
  } catch {
    return DEFAULT_THREADS;
  }
}

export default function AiPage() {
  const [threads, setThreads] = useState<ChatThread[]>(DEFAULT_THREADS);
  const [activeThreadId, setActiveThreadId] = useState(DEFAULT_THREADS[0].id);
  const [draft, setDraft] = useState('');
  const [isMounted, setIsMounted] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    queueMicrotask(() => {
      const savedThreads = loadThreads();
      setThreads(savedThreads);
      setActiveThreadId(savedThreads[0]?.id ?? DEFAULT_THREADS[0].id);
      setIsMounted(true);
    });
  }, []);

  useEffect(() => {
    if (!isMounted) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(threads));
  }, [isMounted, threads]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [activeThreadId, threads]);

  const activeThread = useMemo(() => {
    return threads.find((thread) => thread.id === activeThreadId) ?? threads[0];
  }, [activeThreadId, threads]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const text = draft.trim();
    if (!text || !activeThread) return;

    const sentAt = timeLabel();
    const userMessage: ChatMessage = {
      id: makeId('user'),
      role: 'user',
      text,
      time: sentAt,
    };
    const assistantMessage: ChatMessage = {
      id: makeId('assistant'),
      role: 'assistant',
      text: makeReply(text),
      time: sentAt,
    };

    setThreads((currentThreads) =>
      currentThreads.map((thread) =>
        thread.id === activeThread.id
          ? {
              ...thread,
              title: thread.messages.length <= 1 ? text.slice(0, 34) : thread.title,
              updatedAt: Date.now(),
              messages: [...thread.messages, userMessage, assistantMessage],
            }
          : thread,
      ),
    );
    setDraft('');
  };

  const startNewThread = () => {
    const thread: ChatThread = {
      id: makeId('thread'),
      title: 'Cuoc tro chuyen moi',
      topic: 'Em AI luon o day',
      updatedAt: Date.now(),
      messages: [
        {
          id: makeId('assistant'),
          role: 'assistant',
          text: 'Minh o day voi ban. Bat dau tu mot cau ngan thoi: hom nay trong long ban dang co gi?',
          time: timeLabel(),
        },
      ],
    };

    setThreads((currentThreads) => [thread, ...currentThreads]);
    setActiveThreadId(thread.id);
    setIsHistoryOpen(false);
  };

  const clearHistory = () => {
    setThreads(DEFAULT_THREADS);
    setActiveThreadId(DEFAULT_THREADS[0].id);
    setIsHistoryOpen(false);
  };

  const applyPrompt = (prompt: string) => {
    setDraft(prompt);
  };

  const applyTopic = (topic: string) => {
    setDraft(topic);
    setIsHistoryOpen(false);
  };

  const selectThread = (threadId: string) => {
    setActiveThreadId(threadId);
    setIsHistoryOpen(false);
  };

  if (!activeThread) return null;

  return (
    <Shell>
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
                  <strong>{activeThread.title}</strong>
                  <span>{activeThread.topic}</span>
                </div>
                <button
                  type="button"
                  className={styles.mobileHistoryButton}
                  onClick={() => setIsHistoryOpen(true)}
                  aria-label="Mo lich su chat"
                  aria-expanded={isHistoryOpen}
                >
                  <MessageCircle size={18} />
                </button>
              </div>

              <div className={styles.messages} aria-live="polite">
                {activeThread.messages.map((message) => (
                  <article
                    key={message.id}
                    className={`${styles.message} ${
                      message.role === 'user' ? styles.userMessage : styles.assistantMessage
                    }`}
                  >
                    <p>{message.text}</p>
                    <time>{message.time}</time>
                  </article>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </div>
          </main>

          {isHistoryOpen && (
            <button
              type="button"
              className={styles.historyBackdrop}
              onClick={() => setIsHistoryOpen(false)}
              aria-label="Dong lich su chat"
            />
          )}

          <aside
            className={`${styles.historyPanel} ${isHistoryOpen ? styles.historyOpen : ''}`}
            aria-label="Lich su chat"
          >
            <div className={styles.historyHeader}>
              <div>
                <p>Lich su chat</p>
                <strong>{threads.length} cuoc tro chuyen</strong>
              </div>
              <div className={styles.historyActions}>
                <button type="button" className={styles.iconButton} onClick={startNewThread} aria-label="Tao chat moi">
                  <Plus size={18} />
                </button>
                <button
                  type="button"
                  className={`${styles.iconButton} ${styles.closeHistoryButton}`}
                  onClick={() => setIsHistoryOpen(false)}
                  aria-label="Dong lich su chat"
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
                  className={`${styles.topicButton} ${activeThread.title === topic ? styles.topicActive : ''}`}
                  onClick={() => applyTopic(topic)}
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
                      {thread.messages[thread.messages.length - 1]?.time ?? 'Moi'}
                    </small>
                  </span>
                </button>
              ))}
            </div>

            <button type="button" className={styles.clearButton} onClick={clearHistory}>
              <Trash2 size={16} />
              Xoa lich su demo
            </button>
          </aside>
        </div>

        <div className={styles.promptRow}>
          {PROMPTS.map((prompt) => (
            <button type="button" key={prompt} onClick={() => applyPrompt(prompt)}>
              {prompt}
            </button>
          ))}
        </div>

        <form className={styles.composer} onSubmit={handleSubmit}>
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Nhan vien cua Em AI..."
            aria-label="Tin nhan cho Em AI"
          />
          <button type="submit" aria-label="Gui tin nhan" disabled={!draft.trim()}>
            <Send size={20} />
          </button>
        </form>
      </section>
    </Shell>
  );
}
