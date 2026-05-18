import Shell from '@/components/layout/Shell';
import { getProductBySlug, getProductSlugs } from '@/lib/supabase/products';
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

  return (
    <Shell>
      <ProductDetailClient product={product} />
    </Shell>
  );
}
