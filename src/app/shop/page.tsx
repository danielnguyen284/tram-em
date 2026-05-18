import Shell from '@/components/layout/Shell';
import { getProducts, getProductCategories } from '@/lib/supabase/products';
import ShopClient from './ShopClient';

export const dynamic = 'force-dynamic';

export default async function ShopPage() {
  const [products, categories] = await Promise.all([
    getProducts(),
    getProductCategories(),
  ]);

  return (
    <Shell>
      <ShopClient products={products} categories={categories} />
    </Shell>
  );
}
