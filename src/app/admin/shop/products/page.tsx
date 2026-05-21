import { getAdminProductCategories, getAdminProducts } from '@/lib/admin/data';
import ProductsClient from './ProductsClient';

export default async function AdminProductsPage() {
  const [products, categories] = await Promise.all([
    getAdminProducts(),
    getAdminProductCategories(),
  ]);

  return <ProductsClient initialProducts={products} activeCategories={categories} />;
}
