'use server';

import { createClient } from '@/utils/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

type CheckoutItemInput = {
  id: string;
  quantity: number;
};

function getString(formData: FormData, key: string) {
  return String(formData.get(key) ?? '').trim();
}

function parseCheckoutItems(value: FormDataEntryValue | null): CheckoutItemInput[] {
  if (typeof value !== 'string') return [];

  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((item) => {
        const source = item as { id?: unknown; quantity?: unknown };
        return {
          id: typeof source.id === 'string' ? source.id : '',
          quantity: Number(source.quantity),
        };
      })
      .filter((item) => item.id && Number.isInteger(item.quantity) && item.quantity > 0);
  } catch {
    return [];
  }
}

function fail(message: string) {
  return { error: message };
}

export async function createCheckoutOrder(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user && !user.email_confirmed_at) {
    return fail('Vui lòng xác minh email trước khi thanh toán');
  }

  const shippingName = getString(formData, 'shipping_name');
  const shippingPhone = getString(formData, 'shipping_phone');
  const shippingAddress = getString(formData, 'shipping_address');
  const note = getString(formData, 'note');
  const contactFacebook = getString(formData, 'contact_facebook');
  const shouldSaveAddress = formData.get('save_address') === 'on';
  const items = parseCheckoutItems(formData.get('items'));

  if (!shippingName || !shippingPhone || !shippingAddress) {
    return fail('Vui lòng nhập đầy đủ thông tin giao hàng');
  }

  if (items.length === 0) {
    return fail('Giỏ hàng đang trống');
  }

  const productIds = Array.from(new Set(items.map((item) => item.id)));
  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('id, name, price, images, stock, is_active')
    .in('id', productIds)
    .eq('is_active', true);

  if (productsError || !products || products.length !== productIds.length) {
    return fail('Một số sản phẩm không còn khả dụng.');
  }

  const productsById = new Map(products.map((product) => [product.id, product]));
  
  // Validate stock level for each item first
  for (const item of items) {
    const product = productsById.get(item.id);
    if (!product) {
      return fail('Không tìm thấy thông tin sản phẩm.');
    }
    if (product.stock <= 0) {
      return fail(`Sản phẩm "${product.name}" đã hết hàng.`);
    }
    if (product.stock < item.quantity) {
      return fail(`Sản phẩm "${product.name}" chỉ còn ${product.stock} sản phẩm trong kho (bạn chọn mua ${item.quantity}).`);
    }
  }

  const orderItems = items.map((item) => {
    const product = productsById.get(item.id)!;
    return {
      product_id: product.id,
      product_name: product.name,
      product_image: product.images?.[0] ?? null,
      price: product.price,
      quantity: item.quantity,
    };
  });

  const totalAmount = orderItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

  const serviceClient = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: order, error: orderError } = await serviceClient
    .from('orders')
    .insert({
      user_id: user?.id || null,
      status: 'pending',
      payment_status: 'pending',
      payment_method: 'manual',
      total: totalAmount,
      shipping_name: shippingName,
      shipping_phone: shippingPhone,
      shipping_address: shippingAddress,
      note: note || null,
      contact_phone: shippingPhone,
      contact_facebook: contactFacebook || null,
    })
    .select('id')
    .single();

  if (orderError || !order) {
    console.error('Order creation error:', orderError);
    return fail(`Không thể tạo đơn hàng, vui lòng thử lại (${orderError?.message || 'Unknown'})`);
  }

  const { error: itemsError } = await serviceClient
    .from('order_items')
    .insert(orderItems.map((item) => ({ ...item, order_id: order.id })));

  if (itemsError) {
    await serviceClient.from('orders').delete().eq('id', order.id);
    return fail('Không thể lưu đơn hàng, vui lòng thử lại');
  }

  if (shouldSaveAddress && user) {
    await supabase.from('shipping_addresses').upsert(
      {
        user_id: user.id,
        shipping_name: shippingName,
        shipping_phone: shippingPhone,
        shipping_address: shippingAddress,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' },
    );
  }

  if (user) {
    await supabase.from('cart_items').delete().eq('user_id', user.id);
  }

  return { success: true };
}

export async function saveOrderContact(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const orderId = getString(formData, 'order_id');
  const contactPhone = getString(formData, 'contact_phone');
  const contactFacebook = getString(formData, 'contact_facebook');

  if (!orderId) {
    redirect('/cart');
  }

  if (!contactPhone && !contactFacebook) {
    redirect(
      `/checkout/${orderId}?message=${encodeURIComponent('Vui lòng nhập ít nhất số điện thoại hoặc Facebook/Zalo')}`,
    );
  }

  const { error } = await supabase
    .from('orders')
    .update({
      contact_phone: contactPhone || null,
      contact_facebook: contactFacebook || null,
    })
    .eq('id', orderId)
    .eq('user_id', user.id);

  if (error) {
    redirect(
      `/checkout/${orderId}?message=${encodeURIComponent('Không thể lưu thông tin, vui lòng thử lại')}`,
    );
  }

  revalidatePath(`/checkout/${orderId}`);
  redirect(`/checkout/${orderId}?submitted=1`);
}
