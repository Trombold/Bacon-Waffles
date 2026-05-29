import { getOrders, getCustomerNames } from '@/lib/crm-queries';
import PedidosClient from './PedidosClient';

export const dynamic = 'force-dynamic';

export default async function Pedidos() {
  const [orders, customers] = await Promise.all([getOrders(), getCustomerNames()]);
  return <PedidosClient orders={orders} customers={customers} />;
}
