'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function login(formData: FormData) {
  // BYPASS FOR TESTING ADMIN
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  
  if (email === 'admin@admin.com' && password === 'admin123') {
    revalidatePath('/', 'layout')
    return redirect('/')
  }

  if (process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder')) {
    return redirect(`/login?message=${encodeURIComponent('Lỗi: Vui lòng cấu hình Supabase URL thật trong file .env')}`)
  }

  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  try {
    const { error } = await supabase.auth.signInWithPassword(data)

    if (error) {
      return redirect(`/login?message=${encodeURIComponent('Email hoặc mật khẩu không chính xác')}`)
    }
  } catch (err) {
    return redirect(`/login?message=${encodeURIComponent('Lỗi kết nối server, vui lòng kiểm tra lại cấu hình Supabase')}`)
  }

  revalidatePath('/', 'layout')
  redirect('/')
}

export async function signup(formData: FormData) {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder')) {
    return redirect(`/login?message=${encodeURIComponent('Lỗi: Vui lòng cấu hình Supabase URL thật trong file .env')}`)
  }

  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  try {
    const { error } = await supabase.auth.signUp(data)

    if (error) {
      return redirect(`/login?message=${encodeURIComponent('Email đã tồn tại hoặc thông tin không hợp lệ')}`)
    }
  } catch (err) {
    return redirect(`/login?message=${encodeURIComponent('Lỗi kết nối server, vui lòng kiểm tra lại cấu hình Supabase')}`)
  }

  revalidatePath('/', 'layout')
  redirect(`/login?message=${encodeURIComponent('Vui lòng kiểm tra email để kích hoạt tài khoản')}`)
}

export async function signInWithGoogle() {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`,
    },
  })

  if (error) {
    return redirect(`/login?message=${encodeURIComponent('Lỗi kết nối với Google, vui lòng thử lại sau')}`)
  }

  if (data.url) {
    redirect(data.url)
  }
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}
