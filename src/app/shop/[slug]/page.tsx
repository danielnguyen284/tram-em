import Shell from '@/components/layout/Shell';
import { getProductBySlug, shopProducts } from '@/data/shop';
import { notFound } from 'next/navigation';
import ProductDetailClient from './ProductDetailClient';

export function generateStaticParams() {
  return shopProducts.map((product) => ({
    slug: product.slug,
  }));
}

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  return (
    <Shell>
      <ProductDetailClient product={product} />
    </Shell>
  );
}
