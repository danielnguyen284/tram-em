'use client';

import { useState } from 'react';
import { X, Download, Share, Plus } from 'lucide-react';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import LogoMark from '../layout/LogoMark';
import styles from './PWAInstallPrompt.module.css';

export default function PWAInstallPrompt() {
  const {
    isIOS,
    isAndroid,
    isStandalone,
    isDismissed,
    canInstallAndroid,
    triggerInstall,
    dismissPrompt,
  } = usePWAInstall();

  const [showIOSModal, setShowIOSModal] = useState(false);
  const shouldShowPrompt = !isStandalone && !isDismissed && (isIOS || (isAndroid && canInstallAndroid));

  if (!shouldShowPrompt) return null;

  const handleInstallClick = () => {
    if (isIOS) {
      setShowIOSModal(true);
    } else {
      void triggerInstall();
    }
  };

  const title = isIOS ? 'Thêm Trạm Êm vào màn hình chính' : 'Tải Trạm Êm về máy';
  const description = isIOS
    ? 'Mở hướng dẫn để thêm app vào Màn hình chính trên iPhone/iPad.'
    : 'Tải app về màn hình chính để mở nhanh như ứng dụng riêng.';
  const ctaLabel = isIOS ? 'Hướng dẫn' : 'Tải về';

  return (
    <>
      {/* Floating Banner */}
      <div className={styles.banner}>
        <div className={styles.logoWrapper}>
          <div className={styles.logo}>
            <LogoMark size={32} />
          </div>
        </div>
        <div className={styles.info}>
          <h4 className={styles.title}>{title}</h4>
          <p className={styles.desc}>{description}</p>
        </div>
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.installBtn}
            onClick={handleInstallClick}
          >
            {isIOS ? <Share size={14} /> : <Download size={14} />}
            <span>{ctaLabel}</span>
          </button>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={dismissPrompt}
            aria-label="Đóng thông báo"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* iOS Install Instruction Modal */}
      {showIOSModal && (
        <div className={styles.overlay} onClick={() => setShowIOSModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Cài đặt Trạm Êm trên iOS</h3>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setShowIOSModal(false)}
                aria-label="Đóng hướng dẫn"
              >
                <X size={20} />
              </button>
            </div>

            <div className={styles.steps}>
              <div className={styles.step}>
                <span className={styles.stepNumber}>1</span>
                <div className={styles.stepContent}>
                  <p className={styles.stepText}>
                    Mở trình duyệt <strong>Safari</strong> trên iPhone/iPad, nhấn vào nút <strong>Chia sẻ</strong>
                    <span className={styles.inlineIcon}>
                      <Share size={16} />
                    </span>
                    ở thanh công cụ phía dưới cùng.
                  </p>
                </div>
              </div>

              <div className={styles.step}>
                <span className={styles.stepNumber}>2</span>
                <div className={styles.stepContent}>
                  <p className={styles.stepText}>
                    Cuộn xuống dưới và chọn mục <strong>Thêm vào MH chính</strong> (Add to Home Screen)
                    <span className={styles.inlineIcon}>
                      <Plus size={16} />
                    </span>.
                  </p>
                </div>
              </div>

              <div className={styles.step}>
                <span className={styles.stepNumber}>3</span>
                <div className={styles.stepContent}>
                  <p className={styles.stepText}>
                    Nhấp vào nút <strong>Thêm</strong> (Add) ở góc trên bên phải màn hình để hoàn tất cài đặt.
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              className={styles.okBtn}
              onClick={() => setShowIOSModal(false)}
            >
              Đã hiểu, cảm ơn!
            </button>
          </div>
        </div>
      )}
    </>
  );
}
