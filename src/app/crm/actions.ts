'use server';

import { revalidatePath } from 'next/cache';
import { requireUser } from '@/lib/supabase/server';
import { nextStatus, type OrderStatus } from '@/lib/theme';

// ───────── Productos ─────────

const PREFIX_CAT: Record<string, 'Dulces' | 'Salados' | 'Bebidas'> = {
  DLC: 'Dulces',
  SLD: 'Salados',
  BBD: 'Bebidas',
};

// Genera el siguiente SKU correlativo y único para un prefijo (DLC-007, etc.).
async function nextSku(
  supabase: Awaited<ReturnType<typeof requireUser>>['supabase'],
  prefix: string
): Promise<string> {
  const { data } = await supabase.from('products').select('sku').like('sku', `${prefix}-%`);
  const max = (data || []).reduce((m: number, r: { sku: string }) => {
    const n = parseInt(String(r.sku).split('-')[1] || '0', 10);
    return Number.isFinite(n) && n > m ? n : m;
  }, 0);
  return `${prefix}-${String(max + 1).padStart(3, '0')}`;
}

export async function saveProduct(formData: FormData) {
  const { supabase } = await requireUser();
  const id = String(formData.get('id') || '');
  const sweetRaw = formData.get('sweet');
  const tagRaw = String(formData.get('tag') || '').trim();

  // SKU/categoría: en edición se conservan (el SKU es identidad); en creación
  // el prefijo elegido define la categoría y el SKU se autogenera único.
  let sku: string;
  let cat: string;
  if (id) {
    sku = String(formData.get('sku') || '');
    cat = String(formData.get('cat') || 'Dulces');
  } else {
    const prefix = String(formData.get('prefix') || 'DLC');
    cat = PREFIX_CAT[prefix] || 'Dulces';
    sku = await nextSku(supabase, PREFIX_CAT[prefix] ? prefix : 'DLC');
  }

  const payload = {
    sku,
    name: String(formData.get('name') || ''),
    cat,
    price: Number(formData.get('price') || 0),
    stock: Number(formData.get('stock') || 0),
    active: formData.get('active') === 'on',
    description: String(formData.get('description') || '').trim() || null,
    sweet: sweetRaw && Number(sweetRaw) > 0 ? Number(sweetRaw) : null,
    tag: tagRaw || null,
  };

  if (id) {
    await supabase.from('products').update(payload).eq('id', id);
  } else {
    await supabase.from('products').insert(payload);
  }
  revalidatePath('/crm/productos');
  revalidatePath('/crm');
  revalidatePath('/'); // menú del landing
}

export async function deleteProduct(formData: FormData) {
  const { supabase } = await requireUser();
  await supabase.from('products').delete().eq('id', String(formData.get('id')));
  revalidatePath('/crm/productos');
  revalidatePath('/');
}

export async function toggleProduct(formData: FormData) {
  const { supabase } = await requireUser();
  const id = String(formData.get('id'));
  const active = formData.get('active') === 'true';
  await supabase.from('products').update({ active: !active }).eq('id', id);
  revalidatePath('/crm/productos');
  revalidatePath('/');
}

// ───────── Clientes ─────────

export async function saveCustomer(formData: FormData) {
  const { supabase } = await requireUser();
  const id = String(formData.get('id') || '');
  const payload = {
    name: String(formData.get('name') || ''),
    phone: String(formData.get('phone') || ''),
    zone: String(formData.get('zone') || ''),
  };
  if (id) {
    await supabase.from('customers').update(payload).eq('id', id);
  } else {
    await supabase.from('customers').insert(payload);
  }
  revalidatePath('/crm/clientes');
}

export async function deleteCustomer(formData: FormData) {
  const { supabase } = await requireUser();
  await supabase.from('customers').delete().eq('id', String(formData.get('id')));
  revalidatePath('/crm/clientes');
}

// ───────── Pedidos ─────────

export async function advanceOrder(formData: FormData) {
  const { supabase } = await requireUser();
  const id = String(formData.get('id'));
  const current = String(formData.get('estado')) as OrderStatus;
  const next = nextStatus(current);
  if (next) {
    await supabase.from('orders').update({ estado: next }).eq('id', id);
    revalidatePath('/crm/pedidos');
    revalidatePath('/crm');
  }
}

// Genera el siguiente código #NNNN a partir del máximo numérico existente.
async function nextOrderCode(
  supabase: Awaited<ReturnType<typeof requireUser>>['supabase']
): Promise<string> {
  const { data } = await supabase.from('orders').select('code');
  const max = (data || []).reduce((m: number, r: { code: string }) => {
    const n = parseInt(String(r.code).replace(/\D/g, ''), 10);
    return Number.isFinite(n) && n > m ? n : m;
  }, 1287);
  return `#${max + 1}`;
}

export async function createOrder(formData: FormData) {
  const { supabase } = await requireUser();
  const estado = String(formData.get('estado') || 'recibido') as OrderStatus;
  const code = await nextOrderCode(supabase);
  await supabase.from('orders').insert({
    code,
    cliente: String(formData.get('cliente') || '').trim() || 'Cliente WhatsApp',
    items: String(formData.get('items') || '').trim(),
    total: Number(formData.get('total') || 0),
    estado: ['recibido', 'cocinando', 'en_camino', 'entregado'].includes(estado) ? estado : 'recibido',
  });
  revalidatePath('/crm/pedidos');
  revalidatePath('/crm');
}

export async function archiveOrder(formData: FormData) {
  const { supabase } = await requireUser();
  await supabase.from('orders').update({ archived: true }).eq('id', String(formData.get('id')));
  revalidatePath('/crm/pedidos');
  revalidatePath('/crm');
}

export async function unarchiveOrder(formData: FormData) {
  const { supabase } = await requireUser();
  await supabase.from('orders').update({ archived: false }).eq('id', String(formData.get('id')));
  revalidatePath('/crm/pedidos');
  revalidatePath('/crm');
}

// Archiva de golpe todos los entregados visibles → limpia el Kanban.
export async function archiveDelivered() {
  const { supabase } = await requireUser();
  await supabase.from('orders').update({ archived: true }).eq('estado', 'entregado').eq('archived', false);
  revalidatePath('/crm/pedidos');
  revalidatePath('/crm');
}
