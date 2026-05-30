import { getIngredients, getPurchases, getRecipeLines, getProducts, getMonthlyExpense } from '@/lib/crm-queries';
import InventarioClient from './InventarioClient';

export const dynamic = 'force-dynamic';

export default async function Inventario() {
  const [ingredients, purchases, recipeLines, products, monthlyExpense] = await Promise.all([
    getIngredients(),
    getPurchases(),
    getRecipeLines(),
    getProducts(),
    getMonthlyExpense(),
  ]);
  return (
    <InventarioClient
      ingredients={ingredients}
      purchases={purchases}
      recipeLines={recipeLines}
      products={products}
      monthlyExpense={monthlyExpense}
    />
  );
}
