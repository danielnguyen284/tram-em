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

  const handleSubmit = async () => {
    setLoading(true);
    // Let the form action handle it, but we can add UI loading state here
    // Since we are using standard form action, the redirect will happen
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.logo}>
            <LogoFull width={200} />
          </div>
          {/* <h1 className="text-h2">Trạm Êm</h1> */}
          
        </div>

        <form className={styles.form} action={isLogin ? login : signup} onSubmit={handleSubmit}>
          <Input 
            label="Email" 
            name="email" 
            type="email" 
            placeholder="ban@email.com" 
            required 
          />
          <Input 
            label="Mật khẩu" 
            name="password" 
            type="password" 
            placeholder="••••••••" 
            required 
          />

          {message && (
            <p className={styles.message}>{message}</p>
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
              onClick={() => setIsLogin(!isLogin)} 
              className={styles.toggleBtn}
            >
              {isLogin ? 'Đăng ký ngay' : 'Đăng nhập'}
            </button>
          </p>
          <Link href="/" className={styles.backLink}>Trở về trang chủ</Link>
        </div>
      </div>
    </div>
  );
}
