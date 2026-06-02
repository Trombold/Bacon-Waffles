import { getPromotions, getActiveProducts } from '@/lib/crm-queries';
import PromosClient from './PromosClient';

export const dynamic = 'force-dynamic';

export default async function Promociones() {
  const [promotions, products] = await Promise.all([getPromotions(), getActiveProducts()]);
  return <PromosClient promotions={promotions} products={products} />;
}
