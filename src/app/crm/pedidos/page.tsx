import { getOrders, getCustomerNames, getActiveProducts } from '@/lib/crm-queries';
import PedidosClient from './PedidosClient';

export const dynamic = 'force-dynamic';

export default async function Pedidos() {
  const [orders, customers, products] = await Promise.all([
    getOrders(),
    getCustomerNames(),
    getActiveProducts(),
  ]);
  return <PedidosClient orders={orders} customers={customers} products={products} />;
}
