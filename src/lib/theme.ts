// Paleta D · Verde Profundo — derivada del verde de marca #1c6448 del logo.
// Inversa dark: el verde de marca como fondo dominante, tipografía crema.

export const PALETTE_D = {
  name: 'D · Verde Profundo',
  bg: '#0e1f17',
  paper: '#15291f',
  ink: '#f3ead0',
  brand: '#6dc197', // verde claro inverso para legibilidad
  brandSoft: '#a8d8bd',
  accent: '#d9b673',
  muted: '#9bac9f',
  line: '#234234',
  dark: true,
} as const;

// Tema del CRM derivado de la paleta D (modo oscuro completo).
// Equivale a crmTheme('D') del prototipo de diseño.
export const CRM_THEME = {
  bg: PALETTE_D.bg,
  panel: PALETTE_D.paper,
  sidebar: '#081410',
  sidebarTxt: PALETTE_D.ink,
  sidebarMuted: PALETTE_D.muted,
  ink: PALETTE_D.ink,
  muted: PALETTE_D.muted,
  line: PALETTE_D.line,
  amber: PALETTE_D.brand,
  amber2: PALETTE_D.accent,
  green: PALETTE_D.brandSoft,
  blue: '#7aa4e0',
  red: '#e07a72',
  cream: PALETTE_D.paper,
  estReceived: '#1c2f4a',
  estCooking: '#3a2d18',
  estRoute: '#3a311c',
  estDelivered: '#1c3528',
  cardOnSoft: PALETTE_D.bg,
  searchBg: PALETTE_D.bg,
} as const;

export type OrderStatus = 'recibido' | 'cocinando' | 'en_camino' | 'entregado';

export const ESTADOS: Record<
  OrderStatus,
  { label: string; color: string; bg: string; icon: string }
> = {
  recibido: { label: 'Recibido', color: CRM_THEME.blue, bg: CRM_THEME.estReceived, icon: '📥' },
  cocinando: { label: 'Cocinando', color: CRM_THEME.amber2, bg: CRM_THEME.estCooking, icon: '🔥' },
  en_camino: { label: 'En camino', color: CRM_THEME.amber2, bg: CRM_THEME.estRoute, icon: '🛵' },
  entregado: { label: 'Entregado', color: CRM_THEME.green, bg: CRM_THEME.estDelivered, icon: '✓' },
};

export const STATUS_ORDER: OrderStatus[] = ['recibido', 'cocinando', 'en_camino', 'entregado'];

export type PaymentMethod = 'efectivo' | 'transferencia';

export const METODOS_PAGO: Record<PaymentMethod, { label: string; icon: string; color: string }> = {
  efectivo: { label: 'Efectivo', icon: '💵', color: CRM_THEME.green },
  transferencia: { label: 'Transferencia', icon: '🏦', color: CRM_THEME.blue },
};

export const PAYMENT_ORDER: PaymentMethod[] = ['efectivo', 'transferencia'];

export function nextStatus(s: OrderStatus): OrderStatus | null {
  const i = STATUS_ORDER.indexOf(s);
  return i >= 0 && i < STATUS_ORDER.length - 1 ? STATUS_ORDER[i + 1] : null;
}
