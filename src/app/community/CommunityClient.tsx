'use client';

import type { Post } from '@/types/database';
import { timeAgo } from '@/utils/format';
import { useState, useRef } from 'react';
import { Heart, MessageCircle, Repeat2, MoreHorizontal, Image as ImageIcon, Smile, Send } from 'lucide-react';
import Image from 'next/image';
import styles from './community.module.css';

type CurrentUser = {
  id: string;
  name: string;
  avatar: string;
} | null;

type Props = {
  initialPosts: Post[];
  currentUser: CurrentUser;
};

const TOPIC_TAGS = ['Tất cả', 'ChuaLanh', 'TamSu', 'NhipTho', 'ASMR', 'YeuBanThan'];

function Avatar({ src, size = 40 }: { src: string; size?: number }) {
  return (
    <div className={styles.avatar} style={{ width: size, height: size }}>
      <Image src={src} alt="avatar" fill className={styles.avatarImg} />
    </div>
  );
}

function PostCard({
  post,
  currentUser,
  onLike,
}: {
  post: Post;
  currentUser: CurrentUser;
  onLike: (id: string) => void;
}) {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const authorName = post.author?.display_name ?? 'Ẩn danh';
  const authorAvatar = post.author?.avatar_url ?? `https://i.pravatar.cc/150?u=${post.author_id}`;

  const submitComment = async () => {
    if (!commentText.trim() || !currentUser) return;
    // For now, optimistic — server action can be added later
    setCommentText('');
  };

  return (
    <article className={styles.postCard}>
      <div className={styles.postHeader}>
        <Avatar src={authorAvatar} size={44} />
        <div className={styles.postMeta}>
          <span className={styles.postAuthor}>{authorName}</span>
          <span className={styles.postTime}>{timeAgo(post.created_at)}</span>
        </div>
        <button className={styles.moreBtn}><MoreHorizontal size={18} /></button>
      </div>

      <p className={styles.postText}>{post.content}</p>

      {post.image_url && (
        <div className={styles.postImage}>
          <Image src={post.image_url} alt="post" fill className={styles.postImg} />
        </div>
      )}

      {post.tags.length > 0 && (
        <div className={styles.postTags}>
          {post.tags.map(t => <span key={t} className={styles.tag}>#{t}</span>)}
        </div>
      )}

      <div className={styles.postActions}>
        <button
          className={`${styles.actionBtn} ${post.liked_by_user ? styles.liked : ''}`}
          onClick={() => onLike(post.id)}
        >
          <Heart size={18} fill={post.liked_by_user ? 'currentColor' : 'none'} />
          <span>{post.likes_count}</span>
        </button>
        <button className={styles.actionBtn} onClick={() => setShowComments(v => !v)}>
          <MessageCircle size={18} />
          <span>{post.comments_count ?? 0}</span>
        </button>
        <button className={styles.actionBtn}>
          <Repeat2 size={18} />
          <span>{post.reposts_count}</span>
        </button>
      </div>

      {showComments && currentUser && (
        <div className={styles.commentsSection}>
          <div className={styles.commentInput}>
            <Avatar src={currentUser.avatar} size={30} />
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

export default function CommunityClient({ initialPosts, currentUser }: Props) {
  const [posts, setPosts] = useState(initialPosts);
  const [draft, setDraft] = useState('');
  const [activeTag, setActiveTag] = useState('Tất cả');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleLike = (id: string) => {
    setPosts(prev => prev.map(p =>
      p.id === id
        ? {
            ...p,
            liked_by_user: !p.liked_by_user,
            likes_count: p.liked_by_user ? p.likes_count - 1 : p.likes_count + 1,
          }
        : p
    ));
    // Optimistic — fire-and-forget server call can be added
  };

  const handlePost = () => {
    if (!draft.trim() || !currentUser) return;
    // Optimistic add
    const newPost: Post = {
      id: `temp-${Date.now()}`,
      author_id: currentUser.id,
      content: draft.trim(),
      image_url: null,
      tags: [],
      likes_count: 0,
      reposts_count: 0,
      created_at: new Date().toISOString(),
      author: {
        id: currentUser.id,
        display_name: currentUser.name,
        avatar_url: currentUser.avatar,
        created_at: new Date().toISOString(),
      },
      comments_count: 0,
      liked_by_user: false,
    };
    setPosts(prev => [newPost, ...prev]);
    setDraft('');
  };

  const filteredPosts = activeTag === 'Tất cả'
    ? posts
    : posts.filter(p => p.tags.some(t => t.toLowerCase().includes(activeTag.toLowerCase())));

  return (
    <div className={styles.layout}>
      <main className={styles.feed}>
        <div className={styles.feedHeader}>
          <h1 className={styles.title}>Cộng đồng tích cực</h1>
          <p className={styles.subtitle}>Không phân biệt, chỉ yêu thương và đồng hành</p>
        </div>

        {/* Compose */}
        {currentUser && (
          <div className={styles.compose}>
            <Avatar src={currentUser.avatar} size={42} />
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
        )}

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
            <PostCard key={post.id} post={post} currentUser={currentUser} onLike={handleLike} />
          ))}
          {filteredPosts.length === 0 && (
            <p style={{ textAlign: 'center', opacity: 0.6, padding: '2rem' }}>
              Chưa có bài viết nào. Hãy là người đầu tiên chia sẻ!
            </p>
          )}
        </div>
      </main>

      {/* Sidebar */}
      <aside className={styles.sidebar}>
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
  );
}
