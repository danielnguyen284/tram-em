'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Camera } from 'lucide-react';
import styles from './profile.module.css';

type Props = {
  initialAvatar: string;
};

export default function ProfileAvatar({ initialAvatar }: Props) {
  const [avatar, setAvatar] = useState(initialAvatar);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleAvatarClick = () => {
    if (isUploading) return;
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate client-side
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Ảnh chỉ hỗ trợ định dạng PNG, JPG hoặc WebP.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Dung lượng ảnh tối đa là 5MB.');
      return;
    }

    setError(null);
    setIsUploading(true);

    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const response = await fetch('/api/profile/avatar', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Có lỗi xảy ra khi upload.');
      }

      setAvatar(data.avatarUrl);
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Không thể upload ảnh, vui lòng thử lại.');
    } finally {
      setIsUploading(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className={styles.avatar} onClick={handleAvatarClick} title="Nhấn để đổi avatar">
      <Image
        src={avatar}
        alt="Profile Avatar"
        fill
        sizes="96px"
        className={styles.avatarImg}
        priority
      />
      
      {isUploading ? (
        <div className={styles.uploadingOverlay}>
          <div className={styles.spinner} />
        </div>
      ) : (
        <div className={styles.avatarOverlay}>
          <Camera size={18} />
          <span>Đổi ảnh</span>
        </div>
      )}

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/png, image/jpeg, image/webp"
        style={{ display: 'none' }}
      />

      {error && (
        <div
          style={{
            position: 'absolute',
            bottom: -32,
            left: 0,
            right: 0,
            background: 'var(--color-error-soft, #fee2e2)',
            color: 'var(--color-error, #dc2626)',
            fontSize: '11px',
            padding: '4px 8px',
            borderRadius: '6px',
            textAlign: 'center',
            zIndex: 10,
            whiteSpace: 'nowrap',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {error}
        </div>
      )}
    </div>
  );
}
