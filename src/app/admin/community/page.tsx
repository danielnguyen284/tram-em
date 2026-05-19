import {
  approvePost,
  deleteCommunityModerationTerm,
  deletePost,
  rejectPost,
  saveCommunityModerationTerm,
  toggleCommunityModerationTerm,
} from '@/app/admin/actions';
import { getAdminPosts, getCommunityModerationTerms } from '@/lib/admin/data';
import { timeAgo } from '@/utils/format';
import styles from '../admin.module.css';

const statusLabels = {
  approved: 'Đã duyệt',
  pending_review: 'Chờ duyệt',
  rejected: 'Từ chối',
};

const actionLabels = {
  block: 'Blacklist',
  review: 'Cần duyệt',
};

export default async function AdminCommunityPage() {
  const [posts, terms] = await Promise.all([getAdminPosts(), getCommunityModerationTerms()]);
  const pendingCount = posts.filter((post) => post.moderation_status === 'pending_review').length;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1>Kiểm duyệt cộng đồng</h1>
          <p>Theo dõi bài viết, bình luận và xử lý nội dung không phù hợp.</p>
        </div>
      </header>

      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <h2>Bài viết</h2>
          <span className={styles.muted}>{posts.length} bài / {pendingCount} chờ duyệt</span>
        </div>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Tác giả</th>
              <th>Nội dung</th>
              <th>Trạng thái</th>
              <th>Tương tác</th>
              <th>Thời gian</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {posts.map((post) => (
              <tr key={post.id}>
                <td>{post.author?.display_name ?? 'Ẩn danh'}</td>
                <td>
                  <p className={styles.truncate}>{post.content}</p>
                  <p className={styles.muted}>{post.tags.map((tag) => `#${tag}`).join(' ')}</p>
                  {post.moderation_matches?.length > 0 && (
                    <p className={styles.muted}>Từ khớp: {post.moderation_matches.join(', ')}</p>
                  )}
                </td>
                <td>
                  <span
                    className={`${styles.status} ${
                      post.moderation_status === 'pending_review'
                        ? styles.statusPending
                        : post.moderation_status === 'rejected'
                          ? styles.statusOff
                          : ''
                    }`}
                  >
                    {statusLabels[post.moderation_status]}
                  </span>
                  {post.moderation_reason && <p className={styles.muted}>{post.moderation_reason}</p>}
                </td>
                <td>
                  {post.likes_count} lượt thích / {post.comments_count ?? 0} bình luận
                </td>
                <td>{timeAgo(post.created_at)}</td>
                <td>
                  <div className={styles.actions}>
                    {post.moderation_status === 'pending_review' && (
                      <>
                        <form action={approvePost}>
                          <input type="hidden" name="id" value={post.id} />
                          <button type="submit" className={styles.button}>Duyệt</button>
                        </form>
                        <form action={rejectPost}>
                          <input type="hidden" name="id" value={post.id} />
                          <button type="submit" className={styles.ghostButton}>Từ chối</button>
                        </form>
                      </>
                    )}
                    <form action={deletePost}>
                      <input type="hidden" name="id" value={post.id} />
                      <button type="submit" className={styles.dangerButton}>Xóa</button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <div>
            <h2>Bộ lọc từ ngữ</h2>
            <p className={styles.muted}>Blacklist sẽ chặn đăng ngay. Từ cần duyệt sẽ đưa bài vào hàng chờ CMS.</p>
          </div>
          <span className={styles.muted}>{terms.length} từ khóa</span>
        </div>

        <form action={saveCommunityModerationTerm} className={styles.formGrid}>
          <label>
            Từ hoặc cụm từ
            <input name="term" placeholder="Ví dụ: cụm từ nhạy cảm" />
          </label>
          <label>
            Cơ chế xử lý
            <select name="action" defaultValue="review">
              <option value="review">Cần admin duyệt</option>
              <option value="block">Blacklist, không cho đăng</option>
            </select>
          </label>
          <div className={styles.formFooter}>
            <button type="submit" className={styles.button}>Thêm từ khóa</button>
          </div>
        </form>

        <table className={styles.table}>
          <thead>
            <tr>
              <th>Từ khóa</th>
              <th>Cơ chế</th>
              <th>Trạng thái</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {terms.map((term) => (
              <tr key={term.id}>
                <td>{term.term}</td>
                <td>{actionLabels[term.action]}</td>
                <td>
                  <span className={`${styles.status} ${term.is_active ? '' : styles.statusOff}`}>
                    {term.is_active ? 'Đang bật' : 'Đã tắt'}
                  </span>
                </td>
                <td>
                  <div className={styles.actions}>
                    <form action={toggleCommunityModerationTerm}>
                      <input type="hidden" name="id" value={term.id} />
                      <input type="hidden" name="is_active" value={String(term.is_active)} />
                      <button type="submit" className={styles.ghostButton}>
                        {term.is_active ? 'Tắt' : 'Bật'}
                      </button>
                    </form>
                    <form action={deleteCommunityModerationTerm}>
                      <input type="hidden" name="id" value={term.id} />
                      <button type="submit" className={styles.dangerButton}>Xóa</button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
