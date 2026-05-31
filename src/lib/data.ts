// Bacon Waffles — datos de marca y carta (contenido estático del landing).

export const BRAND = {
  name: 'Bacon Waffles',
  tagline: 'Obrador artesanal · Solo a domicilio · Loja',
  whatsapp: '+593962691364',
  whatsappDisplay: '+593 96 269 1364',
  schedule: 'Lun – Vie · 10:00 a 22:00',
  scheduleShort: 'L–V · 10:00 – 22:00',
  city: 'Loja, Ecuador',
  instagram: '@baconwaffles.lj',
};

export function waLink(msg?: string): string {
  return `https://wa.me/593962691364?text=${encodeURIComponent(
    msg || 'Hola Bacon Waffles, quiero hacer un pedido 🧇'
  )}`;
}

export type MenuItem = {
  name: string;
  price: number;
  desc: string;
  sweet?: number;
  tag?: string;
};

export const MENU: Record<'dulces' | 'salados' | 'combos' | 'bebidas', MenuItem[]> = {
  dulces: [
    { name: 'King Kong', price: 4.75, desc: 'Plátano, manjar, Nutella, galletas Oreo y chantilly', sweet: 5, tag: 'TOP' },
    { name: 'S.Berry Fields', price: 5.0, desc: "Nutella, mermelada de frutos rojos, banana, fresas, Oreo y Hershey's", sweet: 5 },
    { name: 'Tiramisu', price: 5.25, desc: 'Crema de café, mascarpone, bizcotelas, canela y sirope', sweet: 4 },
    { name: 'Frutella', price: 4.75, desc: 'Doble Nutella, doble frutilla y crema chantilly', sweet: 4 },
    { name: 'Maracuyá Passion', price: 5.0, desc: 'Crema de maracuyá, galleta maría triturada y nueces', sweet: 3, tag: 'NUEVO' },
    { name: 'Frutos Rojos', price: 5.0, desc: 'Crema de frutos rojos, fresas y granola', sweet: 3, tag: 'NUEVO' },
    { name: 'Lemon Trip', price: 4.75, desc: 'Crema de limón, galleta triturada, duraznos en almíbar y manjar', sweet: 3 },
    { name: 'Tutti Frutti', price: 4.75, desc: 'Crema de limón, fresa, banana, durazno en almíbar y manjar', sweet: 2 },
  ],
  salados: [
    { name: 'Chicken Cream', price: 6.0, desc: 'Champiñones al vino, tocino, crema, mozzarella, lechuga y papa hilo' },
    { name: 'Cheddar Bacon', price: 5.5, desc: 'Doble cheddar, doble tocino BBQ, lechuga crespa y tomate cherry' },
    { name: 'Carbonatta', price: 5.5, desc: 'Crema salteada con tocino, vino, mozzarella, parmesano y papas al hilo' },
    { name: 'Americano', price: 4.7, desc: 'Huevos (revueltos o fritos), tocino, papas al hilo y miel de maple' },
  ],
  combos: [
    // Solo los combos activos (los inactivos viven en la DB con active=false y no se muestran).
    { name: 'Combo Salado', price: 6.0, desc: 'Waffle de sal a elección + té helado de 250 ml' },
    { name: 'Combo de Frío', price: 7.75, desc: 'Waffle de dulce a elección + chocolate caliente' },
  ],
  bebidas: [
    { name: 'Mocca', price: 3.75, desc: 'Café, caramelo y leche con hielo, nata y espiral de caramelo' },
    { name: 'Strawberries & Cream', price: 3.75, desc: 'Crema, fresa con leche batidos con hielo y nata' },
    { name: 'Pink Coconut', price: 3.5, desc: 'Café, fresa y leche de coco' },
    { name: 'Smoothie', price: 3.0, desc: 'Batido de leche con fresa, banana y durazno' },
    { name: 'Chocolate Mint', price: 2.5, desc: 'Chocolate caliente de menta con malvaviscos' },
    { name: 'Tropical Juice', price: 2.5, desc: 'Jugo de piña con coco' },
  ],
};

export const STEPS = [
  { n: 1, t: 'Elige tu waffle', d: 'Dulce, salado o una bebida del menú.' },
  { n: 2, t: 'Escríbenos a WhatsApp', d: 'Mándanos tu pedido, dirección y método de pago.' },
  { n: 3, t: 'Lo cocinamos al momento', d: 'Recién hecho, sale del obrador a tu puerta.' },
  { n: 4, t: 'Disfruta caliente', d: 'Entrega a domicilio en Loja en ~30 min.' },
];

export const REVIEWS = [
  { n: 'Camila R.', t: 'El King Kong es absurdamente bueno. Llegó calientito y crocante.', s: 5 },
  { n: 'Andrés V.', t: 'Pedí el Carbonatta y quedé sorprendido. Volveré sí o sí.', s: 5 },
  { n: 'Doménica P.', t: 'Atención por WhatsApp súper rápida. Me llegó en 25 min.', s: 5 },
];

export const HERO_IMG = {
  hero: 'https://images.unsplash.com/photo-1598233847491-f16487adee2f?w=1200&q=80',
  dulce: 'https://images.unsplash.com/photo-1562376552-0d160a2f238d?w=900&q=80',
  salado: 'https://images.unsplash.com/photo-1528207776546-365bb710ee93?w=900&q=80',
  bebida: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=900&q=80',
  combo: 'https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?w=900&q=80',
  story: 'https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?w=1200&q=80',
};
