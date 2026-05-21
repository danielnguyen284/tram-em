import { redirect } from 'next/navigation';

export default function AdminShopRedirectPage() {
  redirect('/admin/shop/products');
}
