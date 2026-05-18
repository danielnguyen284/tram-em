'use server';

import { requireAdmin } from '@/lib/admin/auth';
import { createAdminSupabaseClient } from '@/lib/admin/supabase';
import { revalidatePath } from 'next/cache';

function optionalString(value: FormDataEntryValue | null) {
  const text = String(value ?? '').trim();
  return text.length > 0 ? text : null;
}

function numberValue(value: FormDataEntryValue | null, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function listFromLines(value: FormDataEntryValue | null) {
  return String(value ?? '')
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function listFromComma(value: FormDataEntryValue | null) {
  return String(value ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

export async function saveProduct(formData: FormData) {
  await requireAdmin();
  const supabase = createAdminSupabaseClient();
  const id = optionalString(formData.get('id'));
  const name = String(formData.get('name') ?? '').trim();

  const payload = {
    slug: optionalString(formData.get('slug')) ?? slugify(name),
    name,
    category: String(formData.get('category') ?? '').trim(),
    price: numberValue(formData.get('price')),
    old_price: optionalString(formData.get('old_price')) ? numberValue(formData.get('old_price')) : null,
    description: String(formData.get('description') ?? '').trim(),
    details: listFromLines(formData.get('details')),
    images: listFromLines(formData.get('images')),
    tags: listFromComma(formData.get('tags')),
    stock: numberValue(formData.get('stock')),
    rating: numberValue(formData.get('rating')),
    is_active: formData.get('is_active') === 'on',
    updated_at: new Date().toISOString(),
  };

  if (id) {
    await supabase.from('products').update(payload).eq('id', id);
  } else {
    await supabase.from('products').insert(payload);
  }

  revalidatePath('/admin');
  revalidatePath('/admin/shop');
  revalidatePath('/shop');
}

export async function toggleProductActive(formData: FormData) {
  await requireAdmin();
  const supabase = createAdminSupabaseClient();
  const id = String(formData.get('id'));
  const isActive = formData.get('is_active') === 'true';

  await supabase
    .from('products')
    .update({ is_active: !isActive, updated_at: new Date().toISOString() })
    .eq('id', id);

  revalidatePath('/admin/shop');
  revalidatePath('/shop');
}

export async function saveSound(formData: FormData) {
  await requireAdmin();
  const supabase = createAdminSupabaseClient();
  const id = optionalString(formData.get('id'));

  const payload = {
    name: String(formData.get('name') ?? '').trim(),
    category: String(formData.get('category') ?? '').trim(),
    mood: optionalString(formData.get('mood')),
    duration: optionalString(formData.get('duration')),
    icon: optionalString(formData.get('icon')),
    image_url: optionalString(formData.get('image_url')),
    audio_url: String(formData.get('audio_url') ?? '').trim(),
    sort_order: numberValue(formData.get('sort_order')),
    is_active: formData.get('is_active') === 'on',
  };

  if (id) {
    await supabase.from('sounds').update(payload).eq('id', id);
  } else {
    await supabase.from('sounds').insert(payload);
  }

  revalidatePath('/admin');
  revalidatePath('/admin/sounds');
  revalidatePath('/soundscape');
}

export async function toggleSoundActive(formData: FormData) {
  await requireAdmin();
  const supabase = createAdminSupabaseClient();
  const id = String(formData.get('id'));
  const isActive = formData.get('is_active') === 'true';

  await supabase.from('sounds').update({ is_active: !isActive }).eq('id', id);

  revalidatePath('/admin/sounds');
  revalidatePath('/soundscape');
}

export async function updateOrderStatus(formData: FormData) {
  await requireAdmin();
  const supabase = createAdminSupabaseClient();
  const id = String(formData.get('id'));
  const status = String(formData.get('status'));

  await supabase
    .from('orders')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id);

  revalidatePath('/admin');
  revalidatePath('/admin/shop');
}

export async function deletePost(formData: FormData) {
  await requireAdmin();
  const supabase = createAdminSupabaseClient();
  const id = String(formData.get('id'));

  await supabase.from('posts').delete().eq('id', id);
  revalidatePath('/admin');
  revalidatePath('/admin/community');
  revalidatePath('/community');
}

export async function createNotification(formData: FormData) {
  await requireAdmin();
  const supabase = createAdminSupabaseClient();
  const targetUserId = optionalString(formData.get('user_id'));
  const payload = {
    icon: String(formData.get('icon') ?? 'Bell').trim(),
    title: String(formData.get('title') ?? '').trim(),
    body: String(formData.get('body') ?? '').trim(),
    href: optionalString(formData.get('href')),
  };

  if (targetUserId) {
    await supabase.from('notifications').insert({ ...payload, user_id: targetUserId });
  } else {
    const { data: profiles } = await supabase.from('profiles').select('*');
    const rows = (profiles ?? [])
      .filter((profile) => profile.role !== 'admin')
      .map((profile) => ({ ...payload, user_id: profile.id }));

    if (rows.length > 0) {
      await supabase.from('notifications').insert(rows);
    }
  }

  revalidatePath('/admin');
  revalidatePath('/admin/notifications');
  revalidatePath('/notifications');
}

export async function updateProfileRole(formData: FormData) {
  await requireAdmin();
  const supabase = createAdminSupabaseClient();
  const id = String(formData.get('id'));
  const role = String(formData.get('role')) === 'admin' ? 'admin' : 'customer';

  await supabase.from('profiles').update({ role }).eq('id', id);
  revalidatePath('/admin/users');
}
