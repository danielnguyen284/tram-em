'use client';

import { useState, use } from 'react';
import { login, signup, signInWithGoogle } from './actions';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import styles from './login.module.css';
import Link from 'next/link';
import LogoFull from '@/components/layout/LogoFull';

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ message: string }>;
}) {
  const { message } = use(searchParams);
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [clientError, setClientError] = useState('');

  const [formValues, setFormValues] = useState({
    displayName: '',
    username: '',
    phone: '',
    gender: 'Bạn',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormValues({
      ...formValues,
      [e.target.name]: e.target.value
    });
    setClientError('');
  };

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    if (!isLogin) {
      if (!formValues.displayName || !formValues.username || !formValues.phone || !formValues.gender || !formValues.email || !formValues.password || !formValues.confirmPassword) {
        e.preventDefault();
        setClientError('Vui lòng điền đầy đủ các thông tin');
        return;
      }
      if (!/^[a-z0-9_]{3,20}$/.test(formValues.username)) {
        e.preventDefault();
        setClientError('Tên đăng nhập chỉ gồm 3-20 ký tự chữ thường, số, dấu gạch dưới');
        return;
      }
      if (formValues.password !== formValues.confirmPassword) {
        e.preventDefault();
        setClientError('Mật khẩu xác nhận không khớp');
        return;
      }
      if (formValues.password.length < 6) {
        e.preventDefault();
        setClientError('Mật khẩu phải dài tối thiểu 6 ký tự');
        return;
      }
    }
    setLoading(false);
    setLoading(true);
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setClientError('');
    setFormValues({
      displayName: '',
      username: '',
      phone: '',
      gender: 'Bạn',
      email: '',
      password: '',
      confirmPassword: '',
    });
  };

  const activeMessage = clientError || message;

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        {/* Cột trái: Thương hiệu/Logo */}
        <div className={styles.brandSection}>
          <div className={styles.brandLogo}>
            <LogoFull width={240} />
          </div>
          <p className={styles.brandSlogan}>
            Nơi tâm hồn tìm lại sự tĩnh lặng, bình yên và tái tạo nguồn năng lượng tích cực.
          </p>
          <div className={styles.ambientBlob}></div>
        </div>

        {/* Cột phải: Form nhập thông tin */}
        <div className={`${styles.formSection} ${!isLogin ? styles.signupSection : ''}`}>
          <div className={styles.formHeader}>
            <LogoFull width={160} />
          </div>
          
          <h2 className={styles.formTitle}>
            {isLogin ? 'Chào mừng trở lại' : 'Bắt đầu hành trình'}
          </h2>
          <p className={styles.formSubtitle}>
            {isLogin 
              ? 'Đăng nhập để tiếp tục trải nghiệm ốc đảo bình yên' 
              : 'Tạo tài khoản để cá nhân hóa không gian thư giãn của bạn'}
          </p>

          <form className={`${styles.form} ${!isLogin ? styles.signupForm : ''}`} action={isLogin ? login : signup} onSubmit={handleFormSubmit}>
            {!isLogin && (
              <>
                <Input 
                  label="Họ và Tên" 
                  name="displayName" 
                  type="text" 
                  placeholder="Nguyễn Văn A" 
                  value={formValues.displayName}
                  onChange={handleInputChange}
                  required 
                />
                <Input 
                  label="Tên đăng nhập" 
                  name="username" 
                  type="text" 
                  placeholder="tên_dang_nhap (ví dụ: nguyenvana)" 
                  value={formValues.username}
                  onChange={handleInputChange}
                  required 
                />
                <div className={styles.row}>
                <div className={styles.rowCol}>
                  <Input 
                    label="Số điện thoại" 
                    name="phone" 
                    type="tel" 
                    placeholder="0912345678" 
                    value={formValues.phone}
                    onChange={handleInputChange}
                    required 
                  />
                </div>
                <div className={styles.rowCol}>
                  <div className={styles.selectGroup}>
                    <label className={styles.selectLabel}>Giới tính</label>
                    <select 
                      name="gender" 
                      className={styles.select}
                      value={formValues.gender}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="Bạn">Bạn (Khác / Bảo mật)</option>
                      <option value="Nam">Nam (Anh)</option>
                      <option value="Nữ">Nữ (Chị)</option>
                    </select>
                  </div>
                </div>
              </div>
              </>
            )}

            <Input 
              label="Tên đăng nhập hoặc Email" 
              name="email" 
              type="text" 
              placeholder="username hoặc ban@email.com" 
              value={formValues.email}
              onChange={handleInputChange}
              required 
            />
            {isLogin ? (
              <Input 
                label="Mật khẩu" 
                name="password" 
                type="password" 
                placeholder="••••••••" 
                value={formValues.password}
                onChange={handleInputChange}
                required 
              />
            ) : (
              <div className={styles.row}>
                <div className={styles.rowCol}>
                  <Input 
                    label="Mật khẩu" 
                    name="password" 
                    type="password" 
                    placeholder="••••••••" 
                    value={formValues.password}
                    onChange={handleInputChange}
                    required 
                  />
                </div>
                <div className={styles.rowCol}>
                  <Input 
                    label="Xác nhận mật khẩu" 
                    name="confirmPassword" 
                    type="password" 
                    placeholder="••••••••" 
                    value={formValues.confirmPassword}
                    onChange={handleInputChange}
                    required 
                  />
                </div>
              </div>
            )}

            {activeMessage && (
              <p className={styles.message}>{activeMessage}</p>
            )}

            <Button type="submit" isLoading={loading} className={styles.submitBtn}>
              {isLogin ? 'Đăng nhập' : 'Đăng ký'}
            </Button>

            <div className={styles.divider}>
              <span>Hoặc</span>
            </div>

            <button 
              type="button" 
              onClick={() => signInWithGoogle()} 
              className={styles.googleBtn}
            >
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path fill="#EA4335" d="M12 5.04c1.9 0 3.53.74 4.86 1.91l3.64-3.64C18.29 1.19 15.38 0 12 0 7.31 0 3.25 2.69 1.25 6.64l4.23 3.28C6.44 7.07 9.02 5.04 12 5.04z"/>
                <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58l3.86 3c2.26-2.09 3.56-5.17 3.56-8.82z"/>
                <path fill="#FBBC05" d="M5.48 14.73c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09L1.25 7.28C.45 8.86 0 10.43 0 12s.45 3.14 1.25 4.72l4.23-3.99z"/>
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96l-4.23 3.28C3.25 21.31 7.31 24 12 24z"/>
              </svg>
              Tiếp tục với Google
            </button>
          </form>

          <div className={styles.footer}>
            <p className="text-small muted">
              {isLogin ? 'Bạn chưa có tài khoản?' : 'Bạn đã có tài khoản?'}
              <button 
                onClick={toggleMode} 
                className={styles.toggleBtn}
              >
                {isLogin ? 'Đăng ký ngay' : 'Đăng nhập'}
              </button>
            </p>
            <Link href="/" className={styles.backLink}>Trở về trang chủ</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
