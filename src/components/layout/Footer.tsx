'use client';

import Link from 'next/link';
import { Mail, Phone, MapPin } from 'lucide-react';
import LogoMark from './LogoMark';
import { useSoundStore } from '@/store/useSoundStore';
import styles from './Footer.module.css';

// Tự định nghĩa các icon mạng xã hội do phiên bản lucide-react cũ không xuất khẩu
const FacebookIcon = ({ size = 18 }: { size?: number }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

const InstagramIcon = ({ size = 18 }: { size?: number }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

const YoutubeIcon = ({ size = 18 }: { size?: number }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17z" />
    <polygon points="10 15 15 12 10 9" />
  </svg>
);

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const activeSounds = useSoundStore((state) => state.activeSounds);
  const hasPlayer = activeSounds.length > 0;

  return (
    <footer className={`${styles.footer} ${hasPlayer ? styles.hasPlayer : ''}`}>
      <div className={styles.grid}>
        {/* Cột 1: Giới thiệu (About us) */}
        <div className={styles.about}>
          <Link href="/" className={styles.brand}>
            <LogoMark size={40} />
            <span className={styles.brandText}>TRẠM ÊM</span>
          </Link>
          <p className={styles.aboutText}>
            Trạm Êm là ốc đảo chữa lành tâm hồn, nơi cảm xúc của bạn được lắng nghe,
            thấu hiểu và xoa dịu mỗi ngày qua những âm thanh thiên nhiên bình yên và
            các bài tập thiền định sâu lắng.
          </p>
          <div className={styles.socials}>
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.socialIcon}
              aria-label="Facebook"
            >
              <FacebookIcon size={18} />
            </a>
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.socialIcon}
              aria-label="Instagram"
            >
              <InstagramIcon size={18} />
            </a>
            <a
              href="https://youtube.com"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.socialIcon}
              aria-label="Youtube"
            >
              <YoutubeIcon size={18} />
            </a>
          </div>
        </div>

        {/* Cột 2: Liên kết nhanh (Quick links) */}
        <div>
          <h4 className={styles.title}>Liên kết nhanh</h4>
          <ul className={styles.links}>
            <li>
              <Link href="/" className={styles.link}>Trang chủ</Link>
            </li>
            <li>
              <Link href="/about" className={styles.link}>Giới thiệu</Link>
            </li>
            <li>
              <Link href="/soundscape" className={styles.link}>Âm thanh thư giãn</Link>
            </li>
            <li>
              <Link href="/breathing" className={styles.link}>Luyện nhịp thở</Link>
            </li>
            <li>
              <Link href="/games" className={styles.link}>Mini game</Link>
            </li>
            <li>
              <Link href="/community" className={styles.link}>Cộng đồng</Link>
            </li>
          </ul>
        </div>

        {/* Cột 3: Thông tin liên lạc (Contact info) */}
        <div>
          <h4 className={styles.title}>Thông tin liên hệ</h4>
          <div className={styles.contactInfo}>
            <div className={styles.contactItem}>
              <Mail size={16} className={styles.contactIcon} />
              <span>contact@tramem.com</span>
            </div>
            <div className={styles.contactItem}>
              <Phone size={16} className={styles.contactIcon} />
              <span>1900 6868</span>
            </div>
            <div className={styles.contactItem}>
              <MapPin size={16} className={styles.contactIcon} />
              <span>Đại học FPT, xã Hòa Lạc tỉnh Hà Nội</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bản quyền và chính sách */}
      <div className={styles.bottom}>
        <p>© {currentYear} Trạm Êm. Mọi quyền được bảo lưu.</p>
        <div className={styles.bottomLinks}>
          <Link href="/privacy" className={styles.bottomLink}>Chính sách bảo mật</Link>
          <Link href="/terms" className={styles.bottomLink}>Điều khoản dịch vụ</Link>
        </div>
      </div>
    </footer>
  );
}
