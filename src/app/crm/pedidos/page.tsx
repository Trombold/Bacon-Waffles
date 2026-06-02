import { getOrders, getCustomerNames, getActiveProducts, getActivePromotions, getActiveAddons, getRecipeLines } from '@/lib/crm-queries';
import PedidosClient from './PedidosClient';

export const dynamic = 'force-dynamic';

export default async function Pedidos() {
  const [orders, customers, products, promotions, addons, recipes] = await Promise.all([
    getOrders(),
    getCustomerNames(),
    getActiveProducts(),
    getActivePromotions(),
    getActiveAddons(),
    getRecipeLines(),
  ]);
  return (
    <PedidosClient
      orders={orders}
      customers={customers}
      products={products}
      promotions={promotions}
      addons={addons}
      recipes={recipes}
    />
  );
}
