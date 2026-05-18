import { deletePost } from '@/app/admin/actions';
import { getAdminPosts } from '@/lib/admin/data';
import { timeAgo } from '@/utils/format';
import styles from '../admin.module.css';

export default async function AdminCommunityPage() {
  const posts = await getAdminPosts();

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
          <span className={styles.muted}>{posts.length} bài</span>
        </div>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Tác giả</th>
              <th>Nội dung</th>
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
                </td>
                <td>
                  {post.likes_count} lượt thích / {post.comments_count ?? 0} bình luận
                </td>
                <td>{timeAgo(post.created_at)}</td>
                <td>
                  <form action={deletePost}>
                    <input type="hidden" name="id" value={post.id} />
                    <button type="submit" className={styles.dangerButton}>Xóa</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
