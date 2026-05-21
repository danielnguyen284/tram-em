'use client';

import type { Comment, PopularTag, Post } from '@/types/database';
import { timeAgo } from '@/utils/format';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Heart, MessageCircle, MoreHorizontal, Image as ImageIcon, Smile, Send, X, Loader2, ArrowLeft, Share2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import styles from './community.module.css';
import {
  loadCommunityPosts,
  loadPostComments,
  saveCommunityPost,
  savePostComment,
  toggleCommunityLike,
  toggleCommunityCommentLike,
} from './actions';

type CurrentUser = {
  id: string;
  name: string;
  avatar: string;
} | null;

type Props = {
  initialPosts: Post[];
  currentUser: CurrentUser;
  initialPopularTags: PopularTag[];
  initialHasMore: boolean;
  isSinglePostView?: boolean;
};

const FALLBACK_TAGS = ['ChuaLanh', 'TamSu', 'YeuBanThan', 'NhipTho', 'ASMR', 'BinhYen'];

const POPULAR_EMOJIS = [
  '😊', '🥰', '🌸', '✨', '🍃', '🍵', '🕯️', '🧘', '💆', '🌻',
  '❤️', '🎉', '🌟', '🍀', '🌈', '☀️', '☁️', '🎈', '🎵', '🐱',
  '🐶', '🐬', '🐾', '🍕', '🍰', '☕', '🏡', '🌍', '✈️', '💬'
];

function Avatar({ src, size = 40 }: { src: string; size?: number }) {
  const isExternal = src.startsWith('http');
  return (
    <div className={styles.avatar} style={{ width: size, height: size }}>
      <Image
        src={src}
        alt="avatar"
        fill
        sizes={`${size}px`}
        unoptimized={isExternal}
        className={styles.avatarImg}
      />
    </div>
  );
}

function renderPostContent(content: string) {
  if (!content) return null;
  // Split content by whitespace to identify hashtags while preserving all whitespace/newlines
  const parts = content.split(/(\s+)/);
  return parts.map((part, index) => {
    if (part.startsWith('#') && part.length > 1) {
      return (
        <span key={index} className={styles.postHashtag}>
          {part}
        </span>
      );
    }
    return part;
  });
}

function PostCard({
  post,
  currentUser,
  onLike,
  onCommentSaved,
  autoExpandComments = false,
  highlightedCommentId = null,
}: {
  post: Post;
  currentUser: CurrentUser;
  onLike: (id: string) => void;
  onCommentSaved: (id: string) => void;
  autoExpandComments?: boolean;
  highlightedCommentId?: string | null;
}) {
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [hasLoadedComments, setHasLoadedComments] = useState(false);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [commentError, setCommentError] = useState<string | null>(null);
  const [showShareToast, setShowShareToast] = useState(false);

  const authorName = post.author?.display_name ?? 'Ẩn danh';
  const fallbackAvatar =
    post.author?.gender === 'female'
      ? '/images/avatar-default-female.png'
      : '/images/avatar-default-male.png';
  const authorAvatar = post.author?.avatar_url || fallbackAvatar;

  const loadComments = async () => {
    if (hasLoadedComments || isLoadingComments) return;
    setIsLoadingComments(true);
    setCommentError(null);

    try {
      const nextComments = await loadPostComments(post.id);
      setComments(nextComments);
      setHasLoadedComments(true);
    } catch (err: unknown) {
      setCommentError(err instanceof Error ? err.message : 'Không tải được bình luận.');
    } finally {
      setIsLoadingComments(false);
    }
  };

  useEffect(() => {
    if (autoExpandComments || highlightedCommentId) {
      setShowComments(true);
      void loadComments();
    }
  }, [autoExpandComments, highlightedCommentId]);

  const toggleComments = () => {
    setShowComments((value) => !value);
    if (!showComments) {
      void loadComments();
    }
  };

  const handleShare = () => {
    const postUrl = `${window.location.origin}/community/post/${post.id}`;
    void navigator.clipboard.writeText(postUrl);
    setShowShareToast(true);
    setTimeout(() => setShowShareToast(false), 2000);
  };

  const handleLikeComment = async (commentId: string) => {
    if (!currentUser) return;

    // Optimistic update
    setComments((prev) =>
      prev.map((c) => {
        if (c.id === commentId) {
          const nextLiked = !c.liked_by_user;
          const nextCount = (c.likes_count ?? 0) + (nextLiked ? 1 : -1);
          return {
            ...c,
            liked_by_user: nextLiked,
            likes_count: nextCount,
          };
        }
        return c;
      })
    );

    try {
      await toggleCommunityCommentLike(commentId);
    } catch (err) {
      console.warn('Failed to like comment:', err);
      // Revert on error
      setComments((prev) =>
        prev.map((c) => {
          if (c.id === commentId) {
            const nextLiked = !c.liked_by_user;
            const nextCount = (c.likes_count ?? 0) + (nextLiked ? 1 : -1);
            return {
              ...c,
              liked_by_user: nextLiked,
              likes_count: nextCount,
            };
          }
          return c;
        })
      );
    }
  };

  const submitComment = async (parentId: string | null = null) => {
    const content = parentId ? replyText.trim() : commentText.trim();
    if (!content || !currentUser) return;

    setCommentError(null);

    try {
      const saved = await savePostComment(post.id, content, parentId);
      setComments((prev) => [...prev, { ...saved, liked_by_user: false, likes_count: 0 }]);
      onCommentSaved(post.id);

      if (parentId) {
        setReplyText('');
        setReplyTo(null);
      } else {
        setCommentText('');
      }
    } catch (err: unknown) {
      setCommentError(err instanceof Error ? err.message : 'Không đăng được bình luận.');
    }
  };

  const topLevelComments = comments.filter((comment) => !comment.parent_id);
  const repliesByParent = comments.reduce<Record<string, Comment[]>>((acc, comment) => {
    if (comment.parent_id) {
      acc[comment.parent_id] = [...(acc[comment.parent_id] ?? []), comment];
    }
    return acc;
  }, {});

  const renderComment = (comment: Comment, isReply = false) => {
    const commentAuthor = comment.author?.display_name ?? 'Ẩn danh';
    const commentFallbackAvatar =
      comment.author?.gender === 'female'
        ? '/images/avatar-default-female.png'
        : '/images/avatar-default-male.png';
    const commentAvatar = comment.author?.avatar_url || commentFallbackAvatar;
    const isHighlighted = highlightedCommentId === comment.id;

    return (
      <div
        key={comment.id}
        id={`comment-${comment.id}`}
        className={`${styles.comment} ${isReply ? styles.replyComment : ''} ${isHighlighted ? styles.highlightedComment : ''}`}
      >
        <Avatar src={commentAvatar} size={isReply ? 26 : 30} />
        <div className={styles.commentWrap}>
          <div className={styles.commentBody}>
            <span className={styles.commentAuthor}>{commentAuthor}</span>
            <span className={styles.commentText}>{comment.content}</span>
          </div>
          <div className={styles.commentMeta}>
            <span>{timeAgo(comment.created_at)}</span>
            {!isReply && currentUser && (
              <button type="button" onClick={() => setReplyTo(comment.id)}>
                Trả lời
              </button>
            )}
            {currentUser && (
              <button
                type="button"
                onClick={() => handleLikeComment(comment.id)}
                className={`${styles.commentLikeBtn} ${comment.liked_by_user ? styles.commentLiked : ''}`}
              >
                <Heart size={12} fill={comment.liked_by_user ? 'currentColor' : 'none'} />
                <span>{comment.likes_count ?? 0}</span>
              </button>
            )}
          </div>
          {replyTo === comment.id && currentUser && (
            <div className={styles.replyInput}>
              <Avatar src={currentUser.avatar} size={24} />
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder={`Trả lời ${commentAuthor}...`}
                className={styles.commentField}
                rows={1}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    void submitComment(comment.id);
                  }
                }}
              />
              <button className={styles.sendBtn} onClick={() => submitComment(comment.id)}>
                <Send size={15} />
              </button>
              <button className={styles.cancelReplyBtn} onClick={() => setReplyTo(null)}>
                <X size={14} />
              </button>
            </div>
          )}
          {(repliesByParent[comment.id] ?? []).map((reply) => renderComment(reply, true))}
        </div>
      </div>
    );
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

      <p className={styles.postText}>{renderPostContent(post.content)}</p>

      {post.image_url && (
        <div className={styles.postImage}>
          <Image src={post.image_url} alt="post" fill className={styles.postImg} />
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
        <button className={styles.actionBtn} onClick={toggleComments}>
          <MessageCircle size={18} />
          <span>{post.comments_count ?? 0}</span>
        </button>
        <button className={styles.actionBtn} onClick={handleShare} title="Sao chép liên kết bài viết">
          <Share2 size={18} />
          <span>Chia sẻ</span>
        </button>
      </div>

      {showComments && (
        <div className={styles.commentsSection}>
          {isLoadingComments && <p className={styles.commentState}>Đang tải bình luận...</p>}
          {!isLoadingComments && topLevelComments.map((comment) => renderComment(comment))}
          {!isLoadingComments && hasLoadedComments && comments.length === 0 && (
            <p className={styles.commentState}>Chưa có bình luận nào.</p>
          )}
          {commentError && <p className={styles.commentError}>{commentError}</p>}

          {currentUser ? (
            <div className={styles.commentInput}>
              <Avatar src={currentUser.avatar} size={30} />
              <textarea
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                placeholder="Viết bình luận..."
                className={styles.commentField}
                rows={1}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    void submitComment();
                  }
                }}
              />
              <button className={styles.sendBtn} onClick={() => submitComment()}>
                <Send size={16} />
              </button>
            </div>
          ) : (
            <p className={styles.commentState}>Đăng nhập để bình luận.</p>
          )}
        </div>
      )}

      {showShareToast && (
        <div className={styles.shareToast}>
          Đã sao chép liên kết chia sẻ!
        </div>
      )}
    </article>
  );
}

export default function CommunityClient({
  initialPosts,
  currentUser,
  initialPopularTags,
  initialHasMore,
  isSinglePostView = false,
}: Props) {
  const [posts, setPosts] = useState(initialPosts);
  const [draft, setDraft] = useState('');
  const [activeTag, setActiveTag] = useState('Tất cả');
  const [nextOffset, setNextOffset] = useState(initialPosts.length);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isTagLoading, setIsTagLoading] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [moderationNotice, setModerationNotice] = useState<string | null>(null);
  const [highlightedCommentId, setHighlightedCommentId] = useState<string | null>(null);

  // Image Uploading States
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [isImageUploading, setIsImageUploading] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);

  // Emoji Picker State
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const tagList = initialPopularTags.length > 0 ? initialPopularTags.map((tag) => tag.tag) : FALLBACK_TAGS;
  const topicTags = ['Tất cả', ...tagList];

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash && hash.startsWith('#comment-')) {
        const commentId = hash.replace('#comment-', '');
        setHighlightedCommentId(commentId);
        // Scroll target comment into view smoothly
        setTimeout(() => {
          const el = document.getElementById(`comment-${commentId}`);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 800);
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleEmojiClick = (emoji: string) => {
    setDraft(prev => prev + emoji);
    setShowEmojiPicker(false);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handleLike = async (id: string) => {
    // Optimistic toggle
    setPosts(prev => prev.map(p =>
      p.id === id
        ? {
            ...p,
            liked_by_user: !p.liked_by_user,
            likes_count: p.liked_by_user ? p.likes_count - 1 : p.likes_count + 1,
          }
        : p
    ));

    try {
      await toggleCommunityLike(id);
    } catch (err) {
      console.error('Failed to toggle like:', err);
      // Rollback on failure
      setPosts(prev => prev.map(p =>
        p.id === id
          ? {
              ...p,
              liked_by_user: !p.liked_by_user,
              likes_count: p.liked_by_user ? p.likes_count - 1 : p.likes_count + 1,
            }
          : p
      ));
    }
  };

  const loadMorePosts = useCallback(async () => {
    if (isLoadingMore || isTagLoading || !hasMore || isSinglePostView) return;
    setIsLoadingMore(true);

    try {
      const result = await loadCommunityPosts(nextOffset, activeTag);
      setPosts((prev) => [...prev, ...result.posts]);
      setNextOffset(result.nextOffset);
      setHasMore(result.hasMore);
    } finally {
      setIsLoadingMore(false);
    }
  }, [activeTag, hasMore, isLoadingMore, isTagLoading, nextOffset, isSinglePostView]);

  const handleTagSelect = async (tag: string) => {
    if (isSinglePostView) return;
    if (tag === activeTag && posts.length > 0) return;

    setActiveTag(tag);
    setIsTagLoading(true);
    setPosts([]);
    setNextOffset(0);
    setHasMore(true);

    try {
      const result = await loadCommunityPosts(0, tag);
      setPosts(result.posts);
      setNextOffset(result.nextOffset);
      setHasMore(result.hasMore);
    } finally {
      setIsTagLoading(false);
    }
  };

  const handleCommentSaved = (id: string) => {
    setPosts((prev) =>
      prev.map((post) =>
        post.id === id ? { ...post, comments_count: (post.comments_count ?? 0) + 1 } : post,
      ),
    );
  };

  const handleSelectImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
      setImageError('Định dạng ảnh không hỗ trợ. Chỉ nhận PNG, JPG, GIF hoặc WebP.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setImageError('Dung lượng ảnh tối đa là 10MB.');
      return;
    }

    setImageError(null);
    setImagePreviewUrl(URL.createObjectURL(file));
    setIsImageUploading(true);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = (await res.json()) as { url?: string; error?: string };

      if (!res.ok) {
        throw new Error(data.error || 'Lỗi tải ảnh lên server.');
      }

      if (!data.url) {
        throw new Error('Server không trả về URL ảnh.');
      }

      setUploadedImageUrl(data.url);
    } catch (err: unknown) {
      setImageError(err instanceof Error ? err.message : 'Lỗi kết nối upload.');
    } finally {
      setIsImageUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setImagePreviewUrl(null);
    setUploadedImageUrl(null);
    setImageError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handlePost = async () => {
    if (!draft.trim() || !currentUser || isImageUploading || isPosting) return;

    // Automatically parse tags/hashtags from draft content
    const tagMatches = draft.match(/#\w+/g);
    const tags = tagMatches ? tagMatches.map(t => t.slice(1)) : [];
    const content = draft.trim();
    const imageUrl = uploadedImageUrl || undefined;
    setIsPosting(true);
    setModerationNotice(null);

    try {
      const saved = await saveCommunityPost(content, imageUrl, tags);
      setDraft('');
      handleRemoveImage();

      if (saved.moderation_status === 'pending_review') {
        setModerationNotice('Bài viết đã được gửi vào hàng chờ duyệt vì có từ ngữ nhạy cảm.');
        return;
      }

      const shouldPrepend =
        activeTag === 'Tất cả' ||
        saved.tags.some((tag) => tag.toLowerCase() === activeTag.toLowerCase());

      if (shouldPrepend) {
        setPosts(prev => [{ ...saved, liked_by_user: false, comments_count: 0 }, ...prev]);
        setNextOffset((value) => value + 1);
      }
    } catch (err: unknown) {
      console.error('Failed to create post:', err);
      setModerationNotice(err instanceof Error ? err.message : 'Đăng bài viết thất bại. Vui lòng thử lại sau.');
    } finally {
      setIsPosting(false);
    }
  };

  useEffect(() => {
    const target = loadMoreRef.current;
    if (!target || !hasMore || isSinglePostView) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          void loadMorePosts();
        }
      },
      { rootMargin: '260px 0px' },
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [hasMore, loadMorePosts, isSinglePostView]);

  return (
    <div className={`${styles.layout} ${isSinglePostView ? styles.singlePostLayout : ''}`}>
      <main className={styles.feed}>

        {/* Back Link */}
        {isSinglePostView && (
          <div className={styles.backHeader}>
            <Link href="/community" className={styles.backLink}>
              <ArrowLeft size={16} />
              <span>Quay lại Cộng đồng</span>
            </Link>
          </div>
        )}

        {/* Compose */}
        {!isSinglePostView && currentUser && (
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

              {imagePreviewUrl && (
                <div className={styles.imagePreviewContainer}>
                  <Image
                    src={imagePreviewUrl}
                    alt="Preview"
                    width={700}
                    height={280}
                    unoptimized
                    className={styles.imagePreviewImg}
                  />
                  {isImageUploading && (
                    <div className={styles.imagePreviewOverlay}>
                      <Loader2 className={styles.spinner} size={24} />
                      <span>Đang tải ảnh lên...</span>
                    </div>
                  )}
                  {!isImageUploading && (
                    <button className={styles.removeImageBtn} onClick={handleRemoveImage}>
                      <X size={16} />
                    </button>
                  )}
                </div>
              )}

              {imageError && (
                <div className={styles.imageError}>
                  {imageError}
                </div>
              )}

              {moderationNotice && (
                <div className={styles.imageError}>
                  {moderationNotice}
                </div>
              )}

              <div className={styles.composeToolbar}>
                <div className={styles.composeActions} style={{ position: 'relative' }}>
                  <button
                    type="button"
                    className={styles.composeIcon}
                    onClick={() => fileInputRef.current?.click()}
                    title="Đính kèm ảnh"
                  >
                    <ImageIcon size={18} />
                  </button>
                  <button
                    type="button"
                    className={styles.composeIcon}
                    onClick={() => setShowEmojiPicker(prev => !prev)}
                    title="Nhãn dán cảm xúc"
                  >
                    <Smile size={18} />
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleSelectImage}
                    accept="image/png, image/jpeg, image/webp, image/gif"
                    style={{ display: 'none' }}
                  />

                  {showEmojiPicker && (
                    <div className={styles.emojiPicker}>
                      <div className={styles.emojiGrid}>
                        {POPULAR_EMOJIS.map(emoji => (
                          <button
                            key={emoji}
                            type="button"
                            className={styles.emojiBtn}
                            onClick={() => handleEmojiClick(emoji)}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <button
                  className={styles.postBtn}
                  onClick={handlePost}
                  disabled={!draft.trim() || isImageUploading || isPosting}
                >
                  {isPosting ? 'Đang đăng...' : 'Đăng bài'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Filter tags */}
        {!isSinglePostView && (
          <div className={styles.tagFilter}>
            {topicTags.map(t => (
              <button
                key={t}
                className={`${styles.tagBtn} ${activeTag === t ? styles.tagActive : ''}`}
                onClick={() => handleTagSelect(t)}
              >
                #{t}
              </button>
            ))}
          </div>
        )}

        {/* Posts */}
        <div className={styles.posts}>
          {isTagLoading && <p className={styles.feedState}>Đang tải bài viết...</p>}
          {!isTagLoading && posts.map(post => (
            <PostCard
              key={post.id}
              post={post}
              currentUser={currentUser}
              onLike={handleLike}
              onCommentSaved={handleCommentSaved}
              autoExpandComments={isSinglePostView}
              highlightedCommentId={highlightedCommentId}
            />
          ))}
          {!isTagLoading && posts.length === 0 && (
            <p className={styles.feedState}>
              {isSinglePostView ? 'Không tìm thấy bài viết này.' : 'Chưa có bài viết nào. Hãy là người đầu tiên chia sẻ!'}
            </p>
          )}
          {!isSinglePostView && <div ref={loadMoreRef} className={styles.loadMoreSentinel} />}
          {!isSinglePostView && !isTagLoading && hasMore && (
            <button className={styles.loadMoreBtn} onClick={loadMorePosts} disabled={isLoadingMore}>
              {isLoadingMore ? 'Đang tải...' : 'Tải thêm'}
            </button>
          )}
        </div>
      </main>

      {/* Sidebar — hashtags (feed only) */}
      {!isSinglePostView && (
        <aside className={styles.sidebar}>
          <div className={styles.sideCard}>
            <h3 className={styles.sideTitle}>Hashtag phổ biến</h3>
            <div className={styles.hashtagList}>
              {tagList.map(tag => (
                <button
                  key={tag}
                  className={styles.hashtagPill}
                  onClick={() => handleTagSelect(tag)}
                >
                  #{tag}
                </button>
              ))}
            </div>
          </div>
        </aside>
      )}
    </div>
  );
}
