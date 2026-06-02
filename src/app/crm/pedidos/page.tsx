import { getOrders, getCustomerNames, getActiveProducts, getActivePromotions } from '@/lib/crm-queries';
import PedidosClient from './PedidosClient';

export const dynamic = 'force-dynamic';

export default async function Pedidos() {
  const [orders, customers, products, promotions] = await Promise.all([
    getOrders(),
    getCustomerNames(),
    getActiveProducts(),
    getActivePromotions(),
  ]);
  return <PedidosClient orders={orders} customers={customers} products={products} promotions={promotions} />;
}
