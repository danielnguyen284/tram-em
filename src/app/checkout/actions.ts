'use server';

import { createPaymentCode, getPaymentExpiryDate } from '@/lib/sepay';
import { createClient } from '@/utils/supabase/server';
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

function fail(message: string): never {
  redirect(`/checkout?message=${encodeURIComponent(message)}`);
}

export async function createCheckoutOrder(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?message=${encodeURIComponent('Vui lòng đăng nhập để thanh toán')}`);
  }

  if (!user.email_confirmed_at) {
    fail('Vui lòng xác minh email trước khi thanh toán');
  }

  const shippingName = getString(formData, 'shipping_name');
  const shippingPhone = getString(formData, 'shipping_phone');
  const shippingAddress = getString(formData, 'shipping_address');
  const note = getString(formData, 'note');
  const shouldSaveAddress = formData.get('save_address') === 'on';
  const items = parseCheckoutItems(formData.get('items'));

  if (!shippingName || !shippingPhone || !shippingAddress) {
    fail('Vui lòng nhập đầy đủ thông tin giao hàng');
  }

  if (items.length === 0) {
    fail('Giỏ hàng đang trống');
  }

  const productIds = Array.from(new Set(items.map((item) => item.id)));
  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('id, name, price, images, stock, is_active')
    .in('id', productIds)
    .eq('is_active', true);

  if (productsError || !products || products.length !== productIds.length) {
    fail('Một số sản phẩm không còn khả dụng');
  }

  const productsById = new Map(products.map((product) => [product.id, product]));
  const orderItems = items.map((item) => {
    const product = productsById.get(item.id);
    if (!product || product.stock < item.quantity) {
      fail('Một số sản phẩm không đủ số lượng tồn kho');
    }

    return {
      product_id: product.id,
      product_name: product.name,
      product_image: product.images?.[0] ?? null,
      price: product.price,
      quantity: item.quantity,
    };
  });

  const total = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const expiresAt = getPaymentExpiryDate().toISOString();

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      user_id: user.id,
      status: 'pending',
      payment_status: 'pending',
      payment_method: 'sepay',
      total,
      shipping_name: shippingName,
      shipping_phone: shippingPhone,
      shipping_address: shippingAddress,
      note: note || null,
      expires_at: expiresAt,
    })
    .select('id')
    .single();

  if (orderError || !order) {
    fail('Không thể tạo đơn hàng, vui lòng thử lại');
  }

  const paymentCode = createPaymentCode(order.id);
  const { error: paymentCodeError } = await supabase
    .from('orders')
    .update({ payment_code: paymentCode })
    .eq('id', order.id)
    .eq('user_id', user.id);

  const { error: itemsError } = await supabase
    .from('order_items')
    .insert(orderItems.map((item) => ({ ...item, order_id: order.id })));

  if (paymentCodeError || itemsError) {
    await supabase.from('orders').delete().eq('id', order.id).eq('user_id', user.id);
    fail('Không thể lưu đơn hàng, vui lòng thử lại');
  }

  if (shouldSaveAddress) {
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

  await supabase.from('cart_items').delete().eq('user_id', user.id);

  revalidatePath('/checkout');
  redirect(`/checkout/${order.id}`);
}
