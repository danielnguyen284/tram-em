import Shell from '@/components/layout/Shell';
import { getProductBySlug, getProducts, getProductSlugs } from '@/lib/supabase/products';
import { notFound } from 'next/navigation';
import ProductDetailClient from './ProductDetailClient';

export async function generateStaticParams() {
  const slugs = await getProductSlugs();
  return slugs.map((slug) => ({ slug }));
}

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const relatedProducts = (await getProducts(product.category))
    .filter((item) => item.id !== product.id && item.is_active)
    .slice(0, 3);

  return (
    <Shell>
      <ProductDetailClient product={product} relatedProducts={relatedProducts} />
    </Shell>
  );
}
