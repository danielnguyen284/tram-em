'use client';

import Shell from '@/components/layout/Shell';
import { useState, useRef, useCallback } from 'react';
import { Heart, MessageCircle, Repeat2, MoreHorizontal, Image as ImageIcon, Smile, ChevronRight, Send } from 'lucide-react';
import Image from 'next/image';
import styles from './community.module.css';

// ─── Mock data ────────────────────────────────────────────────────────────────
const CURRENT_USER = {
  name: 'Châu',
  avatar: 'https://i.pravatar.cc/150?img=47',
};

type Comment = {
  id: number;
  author: string;
  avatar: string;
  text: string;
  time: string;
};

type Post = {
  id: number;
  author: string;
  avatar: string;
  time: string;
  text: string;
  image?: string;
  likes: number;
  liked: boolean;
  tags: string[];
  comments: Comment[];
  reposts: number;
};

const INITIAL_POSTS: Post[] = [
  {
    id: 1,
    author: 'An Nhiên',
    avatar: 'https://i.pravatar.cc/150?img=12',
    time: '1 giờ trước',
    text: 'Cộng mơ ch hỏi, ngục, dãi đây đã liên dâu yeu thương mhân chữa điều này gì? 🌙',
    image: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&auto=format&fit=crop&q=80',
    likes: 16,
    liked: false,
    tags: ['#fisv', '#ThuonghamDong'],
    reposts: 3,
    comments: [
      { id: 1, author: 'Bình Yên', avatar: 'https://i.pravatar.cc/150?img=9', text: 'Cảm ơn bạn đã chia sẻ! 💜', time: '45 phút trước' },
    ],
  },
  {
    id: 2,
    author: 'An Nhiên',
    avatar: 'https://i.pravatar.cc/150?img=12',
    time: '2 giờ trước',
    text: 'Tâm sự Trạm Êm đó tân tai viởi sói an toàn đờ hành và chữân mình ngay. ✨',
    likes: 8,
    liked: false,
    tags: ['#ChuaLanh'],
    reposts: 1,
    comments: [],
  },
  {
    id: 3,
    author: 'Bình Yên',
    avatar: 'https://i.pravatar.cc/150?img=9',
    time: '3 giờ trước',
    text: 'Hôm nay tôi tập hít thở 10 phút và cảm thấy tốt hơn rất nhiều 🌿 Các bạn có thử chưa?',
    likes: 34,
    liked: true,
    tags: ['#NhipTho', '#SucKhoeTinhThan'],
    reposts: 7,
    comments: [
      { id: 1, author: 'Mây Trôi', avatar: 'https://i.pravatar.cc/150?img=20', text: 'Mình cũng hay làm vậy!', time: '2 giờ trước' },
      { id: 2, author: 'An Nhiên', avatar: 'https://i.pravatar.cc/150?img=12', text: 'Thật sự hiệu quả nha 💙', time: '1 giờ trước' },
    ],
  },
  {
    id: 4,
    author: 'Ngọc Linh',
    avatar: 'https://i.pravatar.cc/150?img=25',
    time: '5 giờ trước',
    text: 'Nhạc ASMR mưa đêm cứu mình qua bao đêm mất ngủ 🌧️ Cảm ơn Trạm Êm!',
    image: 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?w=800&auto=format&fit=crop&q=80',
    likes: 52,
    liked: false,
    tags: ['#ASMR', '#MuaDem'],
    reposts: 11,
    comments: [],
  },
];

const TOPICS = [
  { tag: 'Lưu bật', label: 'Chào mọi người', sub: 'Chia nhít niệm' },
  { tag: 'nox', label: 'Tâm sự tuổi x', sub: 'Chia nhít niệm' },
  { tag: 'ngan', label: 'Ngan liên sẽ dắc dắt', sub: 'Chia nhít niệm' },
  { tag: 'nou', label: 'Nou tìm nhuảm dinh tiền', sub: 'Chia nhít niệm' },
];

const TOPIC_TAGS = ['Tất cả', 'ChuaLanh', 'TamSu', 'NhipTho', 'ASMR', 'YeuBanThan'];

// ─── Components ───────────────────────────────────────────────────────────────
function Avatar({ src, size = 40 }: { src: string; size?: number }) {
  return (
    <div className={styles.avatar} style={{ width: size, height: size }}>
      <Image src={src} alt="avatar" fill className={styles.avatarImg} />
    </div>
  );
}

function PostCard({ post, onLike }: { post: Post; onLike: (id: number) => void }) {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [localComments, setLocalComments] = useState(post.comments);

  const submitComment = () => {
    if (!commentText.trim()) return;
    setLocalComments(prev => [...prev, {
      id: Date.now(),
      author: CURRENT_USER.name,
      avatar: CURRENT_USER.avatar,
      text: commentText.trim(),
      time: 'Vừa xong',
    }]);
    setCommentText('');
  };

  return (
    <article className={styles.postCard}>
      <div className={styles.postHeader}>
        <Avatar src={post.avatar} size={44} />
        <div className={styles.postMeta}>
          <span className={styles.postAuthor}>{post.author}</span>
          <span className={styles.postTime}>{post.time}</span>
        </div>
        <button className={styles.moreBtn}><MoreHorizontal size={18} /></button>
      </div>

      <p className={styles.postText}>{post.text}</p>

      {post.image && (
        <div className={styles.postImage}>
          <Image src={post.image} alt="post" fill className={styles.postImg} />
        </div>
      )}

      {post.tags.length > 0 && (
        <div className={styles.postTags}>
          {post.tags.map(t => <span key={t} className={styles.tag}>{t}</span>)}
        </div>
      )}

      <div className={styles.postActions}>
        <button
          className={`${styles.actionBtn} ${post.liked ? styles.liked : ''}`}
          onClick={() => onLike(post.id)}
        >
          <Heart size={18} fill={post.liked ? 'currentColor' : 'none'} />
          <span>{post.likes}</span>
        </button>
        <button className={styles.actionBtn} onClick={() => setShowComments(v => !v)}>
          <MessageCircle size={18} />
          <span>{localComments.length}</span>
        </button>
        <button className={styles.actionBtn}>
          <Repeat2 size={18} />
          <span>{post.reposts}</span>
        </button>
      </div>

      {showComments && (
        <div className={styles.commentsSection}>
          {localComments.map(c => (
            <div key={c.id} className={styles.comment}>
              <Avatar src={c.avatar} size={30} />
              <div className={styles.commentBody}>
                <span className={styles.commentAuthor}>{c.author}</span>
                <p className={styles.commentText}>{c.text}</p>
                <span className={styles.commentTime}>{c.time}</span>
              </div>
            </div>
          ))}
          <div className={styles.commentInput}>
            <Avatar src={CURRENT_USER.avatar} size={30} />
            <input
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              placeholder="Viết bình luận..."
              className={styles.commentField}
              onKeyDown={e => e.key === 'Enter' && submitComment()}
            />
            <button className={styles.sendBtn} onClick={submitComment}>
              <Send size={16} />
            </button>
          </div>
        </div>
      )}
    </article>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function CommunityPage() {
  const [posts, setPosts] = useState<Post[]>(INITIAL_POSTS);
  const [draft, setDraft] = useState('');
  const [activeTag, setActiveTag] = useState('Tất cả');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleLike = useCallback((id: number) => {
    setPosts(prev => prev.map(p =>
      p.id === id ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 } : p
    ));
  }, []);

  const handlePost = useCallback(() => {
    if (!draft.trim()) return;
    const newPost: Post = {
      id: Date.now(),
      author: CURRENT_USER.name,
      avatar: CURRENT_USER.avatar,
      time: 'Vừa xong',
      text: draft.trim(),
      likes: 0,
      liked: false,
      tags: [],
      reposts: 0,
      comments: [],
    };
    setPosts(prev => [newPost, ...prev]);
    setDraft('');
  }, [draft]);

  const filteredPosts = activeTag === 'Tất cả'
    ? posts
    : posts.filter(p => p.tags.some(t => t.toLowerCase().includes(activeTag.toLowerCase())));

  return (
    <Shell>
      <div className={styles.layout}>
        {/* ── Feed ── */}
        <main className={styles.feed}>
          <div className={styles.feedHeader}>
            <h1 className={styles.title}>Cộng đồng tích cực</h1>
            <p className={styles.subtitle}>Không phân biệt, chỉ yêu thương và đồng hành</p>
          </div>

          {/* Compose */}
          <div className={styles.compose}>
            <Avatar src={CURRENT_USER.avatar} size={42} />
            <div className={styles.composeRight}>
              <textarea
                ref={textareaRef}
                className={styles.composeInput}
                placeholder="Bạn muốn chia sẻ điều gì?"
                value={draft}
                onChange={e => setDraft(e.target.value)}
                rows={3}
              />
              <div className={styles.composeToolbar}>
                <div className={styles.composeActions}>
                  <button className={styles.composeIcon}><ImageIcon size={18} /></button>
                  <button className={styles.composeIcon}><Smile size={18} /></button>
                </div>
                <button
                  className={styles.postBtn}
                  onClick={handlePost}
                  disabled={!draft.trim()}
                >
                  Post
                </button>
              </div>
            </div>
          </div>

          {/* Filter tags */}
          <div className={styles.tagFilter}>
            {TOPIC_TAGS.map(t => (
              <button
                key={t}
                className={`${styles.tagBtn} ${activeTag === t ? styles.tagActive : ''}`}
                onClick={() => setActiveTag(t)}
              >
                #{t}
              </button>
            ))}
          </div>

          {/* Posts */}
          <div className={styles.posts}>
            {filteredPosts.map(post => (
              <PostCard key={post.id} post={post} onLike={handleLike} />
            ))}
          </div>
        </main>

        {/* ── Sidebar ── */}
        <aside className={styles.sidebar}>
          <div className={styles.sideCard}>
            <h3 className={styles.sideTitle}>Chủ đề nổi bật</h3>
            <div className={styles.topicList}>
              {TOPICS.map((t, i) => (
                <div key={i} className={styles.topicItem}>
                  <Avatar src={`https://i.pravatar.cc/150?img=${i + 30}`} size={46} />
                  <div className={styles.topicInfo}>
                    <span className={styles.topicTag}>{t.tag}</span>
                    <span className={styles.topicLabel}>{t.label}</span>
                    <span className={styles.topicSub}>{t.sub}</span>
                  </div>
                </div>
              ))}
            </div>
            <button className={styles.moreTopics}>
              Mình kết sổ <ChevronRight size={14} />
            </button>
          </div>

          <div className={styles.sideCard}>
            <h3 className={styles.sideTitle}>Hashtag phổ biến</h3>
            <div className={styles.hashtagList}>
              {['#ChuaLanh', '#TamSu', '#YeuBanThan', '#NhipTho', '#ASMR', '#BinhYen'].map(h => (
                <button key={h} className={styles.hashtagPill}>{h}</button>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </Shell>
  );
}
