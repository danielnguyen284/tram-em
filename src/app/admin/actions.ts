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
  const categoryId = optionalString(formData.get('category_id'));
  const { data: category } = categoryId
    ? await supabase
        .from('product_categories')
        .select('id, name')
        .eq('id', categoryId)
        .single()
    : { data: null };

  const payload = {
    slug: optionalString(formData.get('slug')) ?? slugify(name),
    name,
    category_id: category?.id ?? null,
    category: category?.name ?? String(formData.get('category') ?? '').trim(),
    price: numberValue(formData.get('price')),
    old_price: optionalString(formData.get('old_price')) ? numberValue(formData.get('old_price')) : null,
    description: String(formData.get('description') ?? '').trim(),
    details: listFromLines(formData.get('details')),
    detail_story: optionalString(formData.get('detail_story')),
    usage_tips: listFromLines(formData.get('usage_tips')),
    suitable_for: listFromLines(formData.get('suitable_for')),
    shipping_note: optionalString(formData.get('shipping_note')),
    return_note: optionalString(formData.get('return_note')),
    quality_note: optionalString(formData.get('quality_note')),
    images: listFromLines(formData.get('images')),
    tags: listFromComma(formData.get('tags')),
    stock: numberValue(formData.get('stock')),
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
  revalidatePath('/shop/[slug]', 'page');
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
  revalidatePath('/shop/[slug]', 'page');
}

export async function deleteProduct(id: string) {
  await requireAdmin();
  const supabase = createAdminSupabaseClient();
  await supabase.from('products').delete().eq('id', id);

  revalidatePath('/admin');
  revalidatePath('/admin/shop');
  revalidatePath('/shop');
  revalidatePath('/shop/[slug]', 'page');
  return { ok: true };
}

export async function saveProductCategory(formData: FormData) {
  await requireAdmin();
  const supabase = createAdminSupabaseClient();
  const id = optionalString(formData.get('id'));
  const name = String(formData.get('name') ?? '').trim();

  if (!name) return;

  const payload = {
    slug: optionalString(formData.get('slug')) ?? slugify(name),
    name,
    sort_order: numberValue(formData.get('sort_order')),
    is_active: formData.get('is_active') === 'on',
    updated_at: new Date().toISOString(),
  };

  if (id) {
    await supabase.from('product_categories').update(payload).eq('id', id);
    await supabase
      .from('products')
      .update({ category: name, updated_at: new Date().toISOString() })
      .eq('category_id', id);
  } else {
    await supabase.from('product_categories').insert(payload);
  }

  revalidatePath('/admin');
  revalidatePath('/admin/shop');
  revalidatePath('/shop');
  revalidatePath('/shop/[slug]', 'page');
}

export async function toggleProductCategoryActive(formData: FormData) {
  await requireAdmin();
  const supabase = createAdminSupabaseClient();
  const id = String(formData.get('id'));
  const isActive = formData.get('is_active') === 'true';

  await supabase
    .from('product_categories')
    .update({ is_active: !isActive, updated_at: new Date().toISOString() })
    .eq('id', id);

  revalidatePath('/admin/shop');
  revalidatePath('/shop');
  revalidatePath('/shop/[slug]', 'page');
}

export async function deleteProductCategory(id: string) {
  await requireAdmin();
  const supabase = createAdminSupabaseClient();
  await supabase.from('product_categories').delete().eq('id', id);

  revalidatePath('/admin');
  revalidatePath('/admin/shop');
  revalidatePath('/shop');
  revalidatePath('/shop/[slug]', 'page');
  return { ok: true };
}

export async function updateCategorySortOrders(orders: { id: string; sort_order: number }[]) {
  await requireAdmin();
  const supabase = createAdminSupabaseClient();
  
  await Promise.all(
    orders.map((order) =>
      supabase
        .from('product_categories')
        .update({ sort_order: order.sort_order, updated_at: new Date().toISOString() })
        .eq('id', order.id)
    )
  );

  revalidatePath('/admin');
  revalidatePath('/admin/shop');
  revalidatePath('/shop');
  revalidatePath('/shop/[slug]', 'page');
  return { ok: true };
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

export async function deleteSound(id: string) {
  await requireAdmin();
  const supabase = createAdminSupabaseClient();
  await supabase.from('sounds').delete().eq('id', id);

  revalidatePath('/admin');
  revalidatePath('/admin/sounds');
  revalidatePath('/soundscape');
  return { ok: true };
}

const orderStatuses = new Set(['pending', 'completed', 'cancelled']);

type UpdateOrderStatusResult =
  | { ok: true }
  | { ok: false; message: string };

export async function updateOrderStatus(id: string, status: string): Promise<UpdateOrderStatusResult> {
  await requireAdmin();
  if (!id || !orderStatuses.has(status)) {
    return { ok: false, message: 'Trạng thái đơn hàng không hợp lệ.' };
  }

  const supabase = createAdminSupabaseClient();

  // 1. Fetch current order status to prevent double deduction / restore
  const { data: currentOrder, error: fetchOrderError } = await supabase
    .from('orders')
    .select('status')
    .eq('id', id)
    .maybeSingle();

  if (fetchOrderError || !currentOrder) {
    return { ok: false, message: 'Không tìm thấy đơn hàng.' };
  }

  const previousStatus = currentOrder.status;

  // 2. Perform inventory adjustments
  if (previousStatus !== 'completed' && status === 'completed') {
    // Transitioning to COMPLETED: deduct stock
    // Fetch items
    const { data: items, error: itemsError } = await supabase
      .from('order_items')
      .select('product_id, quantity, product_name')
      .eq('order_id', id);

    if (itemsError || !items) {
      return { ok: false, message: 'Không thể đọc chi tiết sản phẩm của đơn hàng.' };
    }

    // Check stocks first
    const productIds = items.map((item) => item.product_id);
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name, stock, sales_count')
      .in('id', productIds);

    if (productsError || !products) {
      return { ok: false, message: 'Không thể kiểm tra tồn kho sản phẩm.' };
    }

    const productsById = new Map(products.map((p) => [p.id, p]));

    // Validate all items have enough stock
    for (const item of items) {
      const product = productsById.get(item.product_id);
      if (!product) {
        return { ok: false, message: `Sản phẩm "${item.product_name}" không tồn tại trong hệ thống.` };
      }
      if (product.stock < item.quantity) {
        return { ok: false, message: `Sản phẩm "${product.name}" chỉ còn ${product.stock} trong kho, không đủ để hoàn thành đơn hàng (cần ${item.quantity}).` };
      }
    }

    // Deduct stocks & increase sales count
    for (const item of items) {
      const product = productsById.get(item.product_id)!;
      const { error: updateStockErr } = await supabase
        .from('products')
        .update({ 
          stock: Math.max(0, product.stock - item.quantity),
          sales_count: (product.sales_count || 0) + item.quantity
        })
        .eq('id', item.product_id);

      if (updateStockErr) {
        return { ok: false, message: `Không thể cập nhật kho của sản phẩm "${product.name}".` };
      }
    }
  } else if (previousStatus === 'completed' && status !== 'completed') {
    // Transitioning AWAY from COMPLETED (e.g. cancelled or pending): add stock back & decrease sales count
    const { data: items, error: itemsError } = await supabase
      .from('order_items')
      .select('product_id, quantity, product_name')
      .eq('order_id', id);

    if (itemsError || !items) {
      return { ok: false, message: 'Không thể đọc chi tiết sản phẩm của đơn hàng.' };
    }

    const productIds = items.map((item) => item.product_id);
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name, stock, sales_count')
      .in('id', productIds);

    if (productsError || !products) {
      return { ok: false, message: 'Không thể kiểm tra tồn kho sản phẩm.' };
    }

    const productsById = new Map(products.map((p) => [p.id, p]));

    // Add back stocks & decrease sales count
    for (const item of items) {
      const product = productsById.get(item.product_id);
      if (product) {
        await supabase
          .from('products')
          .update({ 
            stock: product.stock + item.quantity,
            sales_count: Math.max(0, (product.sales_count || 0) - item.quantity)
          })
          .eq('id', item.product_id);
      }
    }
  }

  // 3. Finally update order status
  const { error } = await supabase
    .from('orders')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    return { ok: false, message: 'Không thể cập nhật trạng thái đơn hàng.' };
  }

  revalidatePath('/admin');
  revalidatePath('/admin/shop/orders');
  return { ok: true };
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

export async function approvePost(formData: FormData) {
  const identity = await requireAdmin();
  const supabase = createAdminSupabaseClient();
  const id = String(formData.get('id'));

  await supabase
    .from('posts')
    .update({
      moderation_status: 'approved',
      moderation_reason: null,
      reviewed_by: identity.user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', id);

  revalidatePath('/admin');
  revalidatePath('/admin/community');
  revalidatePath('/community');
}

export async function rejectPost(formData: FormData) {
  const identity = await requireAdmin();
  const supabase = createAdminSupabaseClient();
  const id = String(formData.get('id'));

  await supabase
    .from('posts')
    .update({
      moderation_status: 'rejected',
      moderation_reason: optionalString(formData.get('reason')) ?? 'Admin đã từ chối bài viết.',
      reviewed_by: identity.user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', id);

  revalidatePath('/admin');
  revalidatePath('/admin/community');
  revalidatePath('/community');
}

export async function saveCommunityModerationTerm(formData: FormData) {
  await requireAdmin();
  const supabase = createAdminSupabaseClient();
  const term = String(formData.get('term') ?? '').trim();
  const action = String(formData.get('action')) === 'review' ? 'review' : 'block';

  if (!term) return;

  await supabase
    .from('community_moderation_terms')
    .upsert(
      {
        term,
        action,
        is_active: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'term,action' },
    );

  revalidatePath('/admin/community');
}

export async function toggleCommunityModerationTerm(formData: FormData) {
  await requireAdmin();
  const supabase = createAdminSupabaseClient();
  const id = String(formData.get('id'));
  const isActive = formData.get('is_active') === 'true';

  await supabase
    .from('community_moderation_terms')
    .update({ is_active: !isActive, updated_at: new Date().toISOString() })
    .eq('id', id);

  revalidatePath('/admin/community');
}

export async function deleteCommunityModerationTerm(formData: FormData) {
  await requireAdmin();
  const supabase = createAdminSupabaseClient();
  const id = String(formData.get('id'));

  await supabase.from('community_moderation_terms').delete().eq('id', id);
  revalidatePath('/admin/community');
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

export async function deleteNotification(id: string) {
  await requireAdmin();
  const supabase = createAdminSupabaseClient();
  await supabase.from('notifications').delete().eq('id', id);

  revalidatePath('/admin');
  revalidatePath('/admin/notifications');
  revalidatePath('/notifications');
  return { ok: true };
}

export async function updateProfileRole(formData: FormData) {
  await requireAdmin();
  const supabase = createAdminSupabaseClient();
  const id = String(formData.get('id'));
  const role = String(formData.get('role')) === 'admin' ? 'admin' : 'customer';

  await supabase.from('profiles').update({ role }).eq('id', id);
  revalidatePath('/admin/users');
}
