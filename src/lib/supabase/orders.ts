import type { Order } from '@/types/database';
import { createClient } from '@/utils/supabase/server';

type CreateOrderInput = {
  items: {
    product_id: string;
    product_name: string;
    product_image: string | null;
    price: number;
    quantity: number;
  }[];
  shipping_name: string;
  shipping_phone: string;
  shipping_address: string;
  note?: string;
};

export async function createOrder(input: CreateOrderInput): Promise<Order | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const total = input.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      user_id: user.id,
      total,
      shipping_name: input.shipping_name,
      shipping_phone: input.shipping_phone,
      shipping_address: input.shipping_address,
      note: input.note ?? null,
    })
    .select()
    .single();

  if (orderError || !order) return null;

  const orderItems = input.items.map((item) => ({
    order_id: order.id,
    product_id: item.product_id,
    product_name: item.product_name,
    product_image: item.product_image,
    price: item.price,
    quantity: item.quantity,
  }));

  const { error: itemsError } = await supabase
    .from('order_items')
    .insert(orderItems);

  if (itemsError) return null;

  // Clear user's cart after order
  await supabase
    .from('cart_items')
    .delete()
    .eq('user_id', user.id);

  return order;
}

export async function getOrders(): Promise<Order[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('orders')
    .select('*, items:order_items(*)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) return [];
  return data ?? [];
}
