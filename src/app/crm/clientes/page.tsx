import { getCustomers } from '@/lib/crm-queries';
import ClientsClient from './ClientsClient';

export const dynamic = 'force-dynamic';

export default async function Clientes() {
  const customers = await getCustomers();
  return <ClientsClient customers={customers} />;
}
