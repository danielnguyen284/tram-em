'use client';

import type { CommunityProfile } from '@/types/database';
import { timeAgo } from '@/utils/format';
import { CalendarDays, Heart, MessageCircle, PenLine, Repeat2, Trophy } from 'lucide-react';
import Breadcrumb from '@/components/ui/Breadcrumb';
import Image from 'next/image';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import styles from './community-profile.module.css';

type TabKey = 'badges' | 'posts' | 'comments' | 'reposts';

const tabs: { key: TabKey; label: string }[] = [
  { key: 'badges', label: 'Huy hiệu' },
  { key: 'posts', label: 'Bài đăng' },
  { key: 'comments', label: 'Trả lời' },
  { key: 'reposts', label: 'Đăng lại' },
];

function excerpt(content: string, maxLength = 180) {
  const normalized = content.replace(/\s+/g, ' ').trim();
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength).trim()}...`;
}

export default function CommunityProfileClient({ data }: { data: CommunityProfile }) {
  const [activeTab, setActiveTab] = useState<TabKey>('badges');
  const displayName = data.profile.display_name ?? data.profile.username ?? 'Ẩn danh';
  const fallbackAvatar =
    data.profile.gender === 'female'
      ? '/images/avatar-default-female.png'
      : '/images/avatar-default-male.png';
  const avatar = data.profile.avatar_url ?? fallbackAvatar;
  const joinedText = useMemo(
    () => new Intl.DateTimeFormat('vi-VN', { month: 'long', year: 'numeric' }).format(new Date(data.profile.created_at)),
    [data.profile.created_at],
  );

  return (
    <section className={styles.page}>
      <Breadcrumb items={[{ label: 'Cộng đồng', href: '/community' }, { label: displayName }]} />

      <header className={styles.profileHeader}>
        <div className={styles.avatarWrap}>
          <Image src={avatar} alt={displayName} fill sizes="104px" className={styles.avatarImg} />
        </div>
        <div className={styles.profileInfo}>
          <span className={styles.eyebrow}>Hồ sơ cộng đồng</span>
          <h1>{displayName}</h1>
          {data.profile.username && <p className={styles.username}>@{data.profile.username}</p>}
          <p className={styles.joined}>
            <CalendarDays size={15} />
            <span>Tham gia từ {joinedText}</span>
          </p>
        </div>
      </header>

      <div className={styles.statsGrid}>
        <div className={styles.statItem}>
          <strong>{data.stats.postsCount}</strong>
          <span>bài đăng</span>
        </div>
        <div className={styles.statItem}>
          <strong>{data.stats.commentsCount}</strong>
          <span>bình luận</span>
        </div>
        <div className={styles.statItem}>
          <strong>{data.stats.repostsCount}</strong>
          <span>đăng lại</span>
        </div>
        <div className={styles.statItem}>
          <strong>{data.stats.earnedBadgesCount}</strong>
          <span>huy hiệu</span>
        </div>
      </div>

      <div className={styles.tabs} role="tablist" aria-label="Nội dung hồ sơ cộng đồng">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.key}
            className={`${styles.tabBtn} ${activeTab === tab.key ? styles.tabActive : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'badges' && (
        <div className={styles.badgesGrid}>
          {data.badges.filter(badge => badge.earned).map((badge) => (
            <div key={badge.id} className={styles.badgeCard}>
              <div className={styles.badgeIcon}>
                <Image src={badge.image} alt={badge.name} width={70} height={70} className={styles.badgeImg} />
              </div>
              <div className={styles.badgeText}>
                <strong>{badge.name}</strong>
                <span>{badge.description}</span>
              </div>
              <span className={styles.badgeState}>Đã mở</span>
            </div>
          ))}
          {data.badges.filter(badge => badge.earned).length === 0 && (
            <p className={styles.emptyState}>Người dùng này chưa mở khóa huy hiệu nào.</p>
          )}
        </div>
      )}

      {activeTab === 'posts' && (
        <div className={styles.timeline}>
          {data.posts.map((post) => (
            <Link key={post.id} href={`/community/post/${post.id}`} className={styles.postItem}>
              <div className={styles.itemIcon}>
                <PenLine size={17} />
              </div>
              <div className={styles.itemBody}>
                <p>{excerpt(post.content)}</p>
                {post.image_url && (
                  <div className={styles.postThumb}>
                    <Image src={post.image_url} alt="Ảnh bài đăng" fill sizes="120px" className={styles.thumbImg} />
                  </div>
                )}
                <div className={styles.itemMeta}>
                  <span>{timeAgo(post.created_at)}</span>
                  <span>
                    <Heart size={13} />
                    {post.likes_count}
                  </span>
                  <span>
                    <MessageCircle size={13} />
                    {post.comments_count ?? 0}
                  </span>
                </div>
              </div>
            </Link>
          ))}
          {data.posts.length === 0 && (
            <p className={styles.emptyState}>Người dùng này chưa có bài đăng công khai.</p>
          )}
        </div>
      )}

      {activeTab === 'comments' && (
        <div className={styles.timeline}>
          {data.comments.map((comment) => (
            <Link
              key={comment.id}
              href={`/community/post/${comment.post_id}#comment-${comment.id}`}
              className={styles.commentItem}
            >
              <div className={styles.itemIcon}>
                <MessageCircle size={17} />
              </div>
              <div className={styles.itemBody}>
                <p>{excerpt(comment.content)}</p>
                {comment.post && (
                  <div className={styles.contextBox}>
                    <Trophy size={14} />
                    <span>Trong bài: {excerpt(comment.post.content, 100)}</span>
                  </div>
                )}
                <div className={styles.itemMeta}>
                  <span>{comment.parent_id ? 'Trả lời' : 'Bình luận'}</span>
                  <span>{timeAgo(comment.created_at)}</span>
                  <span>
                    <Heart size={13} />
                    {comment.likes_count ?? 0}
                  </span>
                </div>
              </div>
            </Link>
          ))}
          {data.comments.length === 0 && (
            <p className={styles.emptyState}>Người dùng này chưa có bình luận công khai.</p>
          )}
        </div>
      )}

      {activeTab === 'reposts' && (
        <div className={styles.timeline}>
          {data.reposts.map((repost) => repost.post && (
            <Link key={`${repost.user_id}-${repost.post_id}`} href={`/community/post/${repost.post_id}`} className={styles.postItem}>
              <div className={styles.itemIcon}>
                <Repeat2 size={17} />
              </div>
              <div className={styles.itemBody}>
                <div className={styles.repostHeader}>
                  <span>Đăng lại từ {repost.post.author?.display_name ?? 'Ẩn danh'}</span>
                  <span>{timeAgo(repost.created_at)}</span>
                </div>
                <p>{excerpt(repost.post.content)}</p>
                {repost.post.image_url && (
                  <div className={styles.postThumb}>
                    <Image src={repost.post.image_url} alt="Ảnh bài đăng" fill sizes="120px" className={styles.thumbImg} />
                  </div>
                )}
                <div className={styles.itemMeta}>
                  <span>
                    <Heart size={13} />
                    {repost.post.likes_count}
                  </span>
                  <span>
                    <MessageCircle size={13} />
                    {repost.post.comments_count ?? 0}
                  </span>
                  <span>
                    <Repeat2 size={13} />
                    {repost.post.reposts_count}
                  </span>
                </div>
              </div>
            </Link>
          ))}
          {data.reposts.length === 0 && (
            <p className={styles.emptyState}>Người dùng này chưa đăng lại bài viết nào.</p>
          )}
        </div>
      )}
    </section>
  );
}
