import type { CartItem } from '@/types/database';
import { createClient } from '@/utils/supabase/server';

export async function getCartItems(): Promise<CartItem[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('cart_items')
    .select('*, product:products(*)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true });

  if (error) return [];
  return (data ?? []).map((item) => ({
    ...item,
    product: item.product ?? undefined,
  }));
}

export async function syncCartToDb(
  items: { productId: string; quantity: number }[],
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  // Clear existing cart
  await supabase.from('cart_items').delete().eq('user_id', user.id);

  if (items.length === 0) return;

  // Insert new items
  const rows = items.map((item) => ({
    user_id: user.id,
    product_id: item.productId,
    quantity: item.quantity,
  }));

  await supabase.from('cart_items').insert(rows);
}

export async function addCartItem(productId: string, quantity = 1) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data: existing } = await supabase
    .from('cart_items')
    .select('id, quantity')
    .eq('user_id', user.id)
    .eq('product_id', productId)
    .single();

  if (existing) {
    await supabase
      .from('cart_items')
      .update({ quantity: existing.quantity + quantity })
      .eq('id', existing.id);
  } else {
    await supabase
      .from('cart_items')
      .insert({ user_id: user.id, product_id: productId, quantity });
  }
}

export async function removeCartItem(productId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from('cart_items')
    .delete()
    .eq('user_id', user.id)
    .eq('product_id', productId);
}

export async function clearCart() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from('cart_items').delete().eq('user_id', user.id);
}
