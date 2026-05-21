import { getAdminProductCategories } from '@/lib/admin/data';
import CategoriesClient from './CategoriesClient';

export default async function AdminCategoriesPage() {
  const categories = await getAdminProductCategories();

  return <CategoriesClient initialCategories={categories} />;
}
