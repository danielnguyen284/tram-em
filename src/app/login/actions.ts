'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function login(formData: FormData) {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder')) {
    return redirect(`/login?message=${encodeURIComponent('Lỗi: Vui lòng cấu hình Supabase URL thật trong file .env')}`)
  }

  const supabase = await createClient()

  const emailOrUsername = (formData.get('email') as string || '').trim()
  const password = formData.get('password') as string

  let email = emailOrUsername
  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailOrUsername)
  if (!isEmail) {
    const { data: profileData } = await supabase
      .from('profiles')
      .select('email')
      .eq('username', emailOrUsername.toLowerCase())
      .maybeSingle()

    if (profileData && profileData.email) {
      email = profileData.email
    } else {
      return redirect(`/login?message=${encodeURIComponent('Tên đăng nhập hoặc Email không chính xác')}`)
    }
  }

  let loginError = null
  let user = null
  try {
    const { data: signInData, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    loginError = error
    user = signInData?.user
  } catch {
    return redirect(`/login?message=${encodeURIComponent('Lỗi kết nối server, vui lòng kiểm tra lại cấu hình Supabase')}`)
  }

  if (loginError) {
    return redirect(`/login?message=${encodeURIComponent('Tên đăng nhập/Email hoặc mật khẩu không chính xác')}`)
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

  const displayName = formData.get('displayName') as string
  const usernameInput = (formData.get('username') as string || '').trim().toLowerCase()
  const phone = formData.get('phone') as string
  const gender = formData.get('gender') as string
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirmPassword') as string

  if (!displayName || !usernameInput || !phone || !gender || !email || !password || !confirmPassword) {
    return redirect(`/login?message=${encodeURIComponent('Vui lòng điền đầy đủ các thông tin bắt buộc')}`)
  }

  if (!/^[a-z0-9_]{3,20}$/.test(usernameInput)) {
    return redirect(`/login?message=${encodeURIComponent('Tên đăng nhập chỉ từ 3-20 ký tự gồm chữ thường, số, dấu gạch dưới')}`)
  }

  // Check unique username
  const { data: existingUser } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', usernameInput)
    .maybeSingle()

  if (existingUser) {
    return redirect(`/login?message=${encodeURIComponent('Tên đăng nhập đã tồn tại, vui lòng chọn tên khác')}`)
  }

  if (password !== confirmPassword) {
    return redirect(`/login?message=${encodeURIComponent('Mật khẩu xác nhận không khớp')}`)
  }

  if (password.length < 6) {
    return redirect(`/login?message=${encodeURIComponent('Mật khẩu phải dài tối thiểu 6 ký tự')}`)
  }

  let signupError = null
  try {
    const appUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${appUrl}/auth/callback`,
        data: {
          full_name: displayName,
          username: usernameInput,
          phone: phone,
          gender: gender,
        },
      },
    })
    signupError = error
  } catch {
    return redirect(`/login?message=${encodeURIComponent('Lỗi kết nối server, vui lòng kiểm tra lại cấu hình Supabase')}`)
  }

  if (signupError) {
    return redirect(`/login?message=${encodeURIComponent(signupError.message || 'Email đã tồn tại hoặc thông tin không hợp lệ')}`)
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
