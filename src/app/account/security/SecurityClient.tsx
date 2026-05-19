'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { ChevronLeft, User, Lock, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import Input from '@/components/ui/Input';
import styles from './security.module.css';

type Profile = {
  display_name: string | null;
  phone: string | null;
  gender: string | null;
  username: string | null;
  address: string | null;
  email: string | null;
};

type Props = {
  initialProfile: Profile | null;
  userEmail: string;
};

export default function SecurityClient({ initialProfile, userEmail }: Props) {
  const router = useRouter();
  const supabase = createClient();

  // Profile Form State
  const [displayName, setDisplayName] = useState(initialProfile?.display_name || '');
  const [username, setUsername] = useState(initialProfile?.username || '');
  const [phone, setPhone] = useState(initialProfile?.phone || '');
  const [gender, setGender] = useState(initialProfile?.gender || 'Bạn');
  const [address, setAddress] = useState(initialProfile?.address || '');

  // Password Form State
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Status state
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Update Profile Submit Handler
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileSuccess(false);
    setProfileError(null);

    const cleanUsername = username.trim().toLowerCase();

    // Validations
    if (!displayName.trim() || !cleanUsername || !phone.trim() || !gender) {
      setProfileError('Vui lòng điền đầy đủ các thông tin bắt buộc.');
      setProfileLoading(false);
      return;
    }

    if (!/^[a-z0-9_]{3,20}$/.test(cleanUsername)) {
      setProfileError('Tên đăng nhập chỉ từ 3-20 ký tự gồm chữ thường, số, dấu gạch dưới.');
      setProfileLoading(false);
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setProfileError('Vui lòng đăng nhập lại.');
        setProfileLoading(false);
        return;
      }

      // Check username uniqueness if changed
      if (cleanUsername !== initialProfile?.username) {
        const { data: duplicateUser } = await supabase
          .from('profiles')
          .select('id')
          .eq('username', cleanUsername)
          .maybeSingle();

        if (duplicateUser) {
          setProfileError('Tên đăng nhập đã tồn tại, vui lòng chọn tên khác.');
          setProfileLoading(false);
          return;
        }
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: displayName.trim(),
          username: cleanUsername,
          phone: phone.trim(),
          gender: gender,
          address: address.trim(),
        })
        .eq('id', user.id);

      if (error) {
        throw error;
      }

      setProfileSuccess(true);
      router.refresh();
    } catch (err: any) {
      setProfileError(err.message || 'Lỗi khi cập nhật thông tin cá nhân.');
    } finally {
      setProfileLoading(false);
    }
  };

  // Update Password Submit Handler
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordLoading(true);
    setPasswordSuccess(false);
    setPasswordError(null);

    if (!newPassword || !confirmPassword) {
      setPasswordError('Vui lòng nhập mật khẩu đầy đủ.');
      setPasswordLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Mật khẩu xác nhận không khớp.');
      setPasswordLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('Mật khẩu phải dài tối thiểu 6 ký tự.');
      setPasswordLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        throw error;
      }

      setPasswordSuccess(true);
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPasswordError(err.message || 'Không thể thay đổi mật khẩu.');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <button onClick={() => router.push('/profile')} className={styles.backBtn} title="Quay lại hồ sơ">
          <ChevronLeft size={20} />
        </button>
        <div className={styles.titleSection}>
          <h1>Tài khoản & bảo mật</h1>
          <p>Quản lý hồ sơ cá nhân và cấu hình bảo mật tài khoản của bạn</p>
        </div>
      </div>

      <div className={styles.grid}>
        {/* Card 1: Thông tin cá nhân */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h3>Thông tin cá nhân</h3>
            <p>Chỉnh sửa các thông tin cơ bản và địa chỉ nhận hàng của bạn</p>
          </div>

          {profileSuccess && (
            <div className={`${styles.alert} ${styles.alertSuccess}`}>
              <CheckCircle size={16} />
              <span>Cập nhật thông tin cá nhân thành công!</span>
            </div>
          )}

          {profileError && (
            <div className={`${styles.alert} ${styles.alertError}`}>
              <AlertCircle size={16} />
              <span>{profileError}</span>
            </div>
          )}

          <form onSubmit={handleProfileSubmit} className={styles.form}>
            <div className={styles.row}>
              <div className={styles.rowCol}>
                <Input
                  label="Họ và Tên *"
                  placeholder="Nguyễn Văn A"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
                />
              </div>
              <div className={styles.rowCol}>
                <Input
                  label="Tên đăng nhập *"
                  placeholder="nguyenvana"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className={styles.row}>
              <div className={styles.rowCol}>
                <Input
                  label="Số điện thoại *"
                  placeholder="0912345678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>
              <div className={styles.rowCol}>
                <div className={styles.selectGroup}>
                  <label className={styles.selectLabel}>Giới tính *</label>
                  <select
                    className={styles.select}
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    required
                  >
                    <option value="Bạn">Bạn (Khác)</option>
                    <option value="Nam">Nam (Anh)</option>
                    <option value="Nữ">Nữ (Chị)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className={styles.textareaGroup}>
              <label className={styles.selectLabel}>Địa chỉ giao hàng</label>
              <textarea
                className={styles.textarea}
                placeholder="123 Đường ABC, Phường X, Quận Y, Thành phố Z"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>

            <div>
              <button type="submit" disabled={profileLoading} className={styles.submitBtn}>
                {profileLoading ? (
                  <>
                    <Loader className="animate-spin" size={16} />
                    <span>Đang lưu...</span>
                  </>
                ) : (
                  <>
                    <User size={16} />
                    <span>Lưu thay đổi</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Card 2: Bảo mật & Mật khẩu */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h3>Mật khẩu & Bảo mật</h3>
            <p>Thay đổi mật khẩu đăng nhập tài khoản</p>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <Input
              label="Địa chỉ Email (Không thể thay đổi)"
              value={userEmail}
              disabled
              style={{ opacity: 0.7, cursor: 'not-allowed' }}
            />
          </div>

          {passwordSuccess && (
            <div className={`${styles.alert} ${styles.alertSuccess}`}>
              <CheckCircle size={16} />
              <span>Đổi mật khẩu thành công!</span>
            </div>
          )}

          {passwordError && (
            <div className={`${styles.alert} ${styles.alertError}`}>
              <AlertCircle size={16} />
              <span>{passwordError}</span>
            </div>
          )}

          <form onSubmit={handlePasswordSubmit} className={styles.form}>
            <Input
              label="Mật khẩu mới *"
              type="password"
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />

            <Input
              label="Xác nhận mật khẩu mới *"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />

            <div>
              <button type="submit" disabled={passwordLoading} className={styles.submitBtn}>
                {passwordLoading ? (
                  <>
                    <Loader className="animate-spin" size={16} />
                    <span>Đang thay đổi...</span>
                  </>
                ) : (
                  <>
                    <Lock size={16} />
                    <span>Đổi mật khẩu</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
