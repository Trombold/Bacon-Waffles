import { getProducts } from '@/lib/crm-queries';
import ProductsClient from './ProductsClient';

export const dynamic = 'force-dynamic';

export default async function Productos() {
  const products = await getProducts();
  return <ProductsClient products={products} />;
}
