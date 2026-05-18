'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function login(formData: FormData) {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder')) {
    return redirect(`/login?message=${encodeURIComponent('Lỗi: Vui lòng cấu hình Supabase URL thật trong file .env')}`)
  }

  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  let loginError = null
  let user = null
  try {
    const { data: signInData, error } = await supabase.auth.signInWithPassword(data)
    loginError = error
    user = signInData?.user
  } catch {
    return redirect(`/login?message=${encodeURIComponent('Lỗi kết nối server, vui lòng kiểm tra lại cấu hình Supabase')}`)
  }

  if (loginError) {
    return redirect(`/login?message=${encodeURIComponent('Email hoặc mật khẩu không chính xác')}`)
  }

  let isAdmin = false
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    const profileRole = profile?.role
    const metadataRole = user.app_metadata?.role
    isAdmin = profileRole === 'admin' || metadataRole === 'admin'
  }

  revalidatePath('/', 'layout')
  if (isAdmin) {
    redirect('/admin')
  } else {
    redirect('/')
  }
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

  let signupError = null
  try {
    const appUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const { error } = await supabase.auth.signUp({
      ...data,
      options: {
        emailRedirectTo: `${appUrl}/auth/callback`,
      },
    })
    signupError = error
  } catch {
    return redirect(`/login?message=${encodeURIComponent('Lỗi kết nối server, vui lòng kiểm tra lại cấu hình Supabase')}`)
  }

  if (signupError) {
    return redirect(`/login?message=${encodeURIComponent('Email đã tồn tại hoặc thông tin không hợp lệ')}`)
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
