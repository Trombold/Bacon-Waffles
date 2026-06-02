import Link from 'next/link';
import { BRAND, STEPS, HERO_IMG, waLink, type MenuItem } from '@/lib/data';
import { getMenu } from '@/lib/menu';
import { getPublicReviews } from '@/lib/reviews';
import { getPublicPromos } from '@/lib/promos';
import { PALETTE_D as P } from '@/lib/theme';

// Revalida el menú público cada 60s (editable desde el CRM).
export const revalidate = 60;

// Wordmark del logo oficial, renderizado como texto (escala consistente).
function BWLogo({ height = 56 }: { height?: number }) {
  return (
    <div className="bw-logo" style={{ ['--h' as string]: `${height}px` }}>
      <div className="bw-logo-top">BACON</div>
      <div className="bw-logo-main">
        W<span style={{ fontStyle: 'italic' }}>AFF</span>LES
      </div>
    </div>
  );
}

function Stars({ n }: { n: number }) {
  return (
    <span className="star">
      {'★'.repeat(n)}
      <span style={{ opacity: 0.25 }}>{'★'.repeat(5 - n)}</span>
    </span>
  );
}

function MenuCategory({
  label,
  index,
  img,
  items,
  note,
}: {
  label: string;
  index: number;
  img: string;
  items: MenuItem[];
  note?: string;
}) {
  return (
    <div className="menu-cat">
      <div className="menu-cat-aside">
        <div className="display menu-cat-title">{label}</div>
        <div className="mono muted menu-cat-meta">
          0{index} · {items.length} opciones
        </div>
        {note && (
          <p className="menu-cat-note">
            <span className="star">★</span> {note}
          </p>
        )}
        <div className="menu-cat-img">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={img} alt={label} />
        </div>
      </div>
      <div className="menu-cat-list">
        {items.map((it, i) => (
          <div key={i} className="menu-row">
            <div>
              <div className="menu-row-head">
                <h3 className="display menu-row-name">{it.name}</h3>
                {it.tag && <span className="mono brand menu-row-tag">· {it.tag}</span>}
                {it.sweet && <Stars n={it.sweet} />}
              </div>
              <p className="muted menu-row-desc">{it.desc}</p>
            </div>
            <div className="price">${it.price.toFixed(2)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default async function Landing() {
  const menu = await getMenu();
  const reviews = await getPublicReviews();
  const promos = await getPublicPromos();
  const css = `
    .v1d { background: ${P.bg}; color: ${P.ink}; font-family: 'Manrope', system-ui, sans-serif; max-width: 1440px; margin: 0 auto; }
    .v1d .display { font-family: 'Cormorant Garamond', 'Times New Roman', serif; font-weight: 500; letter-spacing: -0.02em; }
    .v1d .mono { font-family: 'JetBrains Mono', ui-monospace, monospace; letter-spacing: 0.04em; }
    .v1d .brand { color: ${P.brand}; }
    .v1d .accent { color: ${P.accent}; }
    .v1d .muted { color: ${P.muted}; }
    .v1d .rule { border: 0; border-top: 1px solid ${P.line}; margin: 0 64px; }
    .v1d .pill { display: inline-flex; align-items: center; gap: 8px; padding: 8px 14px; border: 1px solid ${P.brand}55; border-radius: 999px; font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase; color: ${P.brand}; background: ${P.paper}; }
    .v1d .cta { display: inline-flex; align-items: center; gap: 10px; padding: 18px 28px; background: ${P.brand}; color: ${P.bg}; border-radius: 999px; font-weight: 600; font-size: 14px; letter-spacing: 0.06em; text-transform: uppercase; text-decoration: none; transition: background .25s ease, color .25s ease, transform .25s ease, box-shadow .25s ease; }
    .v1d .cta:hover { background: ${P.accent}; color: ${P.bg}; transform: translateY(-2px); box-shadow: 0 10px 24px ${P.accent}3d; }
    .v1d .cta.alt { background: transparent; color: ${P.ink}; border: 1px solid ${P.ink}40; box-shadow: none; }
    .v1d .cta.alt:hover { background: transparent; color: ${P.accent}; border-color: ${P.accent}; box-shadow: none; }
    .v1d .price { font-family: 'Cormorant Garamond', serif; font-size: 34px; font-weight: 500; color: ${P.brand}; text-align: right; white-space: nowrap; }
    .v1d .star { color: ${P.brand}; font-size: 12px; letter-spacing: 2px; }
    .v1d a.nav { color: ${P.muted}; text-decoration: none; }
    .v1d a.nav:hover { color: ${P.brand}; }

    .bw-logo { display: inline-flex; flex-direction: column; align-items: center; line-height: 1; font-family: 'Cormorant Garamond', serif; }
    .bw-logo-top { font-family: 'Manrope', sans-serif; font-size: calc(var(--h) * 0.18); letter-spacing: 0.22em; font-weight: 600; color: ${P.brand}; margin-bottom: calc(var(--h) * 0.06); }
    .bw-logo-main { font-size: calc(var(--h) * 0.78); letter-spacing: 0.015em; font-weight: 500; color: ${P.brand}; }

    .v1d header.site { display: flex; align-items: center; justify-content: space-between; padding: 24px 64px; border-bottom: 1px solid ${P.line}; }
    .v1d nav.site { display: flex; gap: 36px; font-size: 12px; letter-spacing: 0.18em; text-transform: uppercase; }
    .v1d .crm-btn { font-family: 'JetBrains Mono', monospace; font-size: 11px; padding: 8px 14px; border: 1px solid ${P.brand}55; border-radius: 999px; color: ${P.brand}; text-decoration: none; letter-spacing: 0.16em; text-transform: uppercase; background: ${P.paper}; white-space: nowrap; transition: background .25s ease, color .25s ease, border-color .25s ease; }
    .v1d .crm-btn:hover { background: ${P.brand}; color: ${P.bg}; border-color: ${P.brand}; }

    .v1d section.hero { padding: 88px 64px 96px; }
    .v1d .hero-grid { display: grid; grid-template-columns: 1.05fr 0.95fr; gap: 64px; align-items: center; }
    .v1d .hero h1 { font-size: 116px; line-height: 0.95; margin: 0 0 24px; letter-spacing: -0.03em; }
    .v1d .hero-lead { font-size: 19px; line-height: 1.6; max-width: 480px; margin: 0 0 36px; }
    .v1d .hero-ctas { display: flex; gap: 12px; flex-wrap: wrap; }
    .v1d .hero-stats { display: flex; gap: 48px; margin-top: 64px; padding-top: 32px; border-top: 1px solid ${P.line}; }
    .v1d .hero-stats .num { font-size: 44px; line-height: 1; }
    .v1d .hero-stats .lbl { font-size: 10px; text-transform: uppercase; letter-spacing: 0.18em; margin-top: 8px; }
    .v1d .hero-card { position: relative; aspect-ratio: 4/5; border-radius: 2px; overflow: hidden; border: 1px solid ${P.line}; }
    .v1d .hero-card img { width: 100%; height: 100%; object-fit: cover; filter: brightness(0.9) saturate(0.95); }
    .v1d .hero-card .grad { position: absolute; inset: 0; background: linear-gradient(180deg, transparent 50%, ${P.bg}cc 100%); }
    .v1d .hero-card .cap { position: absolute; bottom: 32px; left: 32px; right: 32px; color: #fff; }

    .v1d section.promos { padding: 72px 64px; background: ${P.paper}; border-bottom: 1px solid ${P.line}; }
    .v1d .promos-head { display: flex; align-items: baseline; gap: 16px; margin-bottom: 40px; flex-wrap: wrap; }
    .v1d .promo-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 24px; }
    .v1d .promo-card { position: relative; padding: 32px; border: 1px solid ${P.brand}55; border-radius: 4px; background: ${P.bg}; overflow: hidden; }
    .v1d .promo-card::before { content: '🎁'; position: absolute; top: -14px; right: -6px; font-size: 72px; opacity: 0.08; }
    .v1d .promo-badge { display: inline-block; font-family: 'JetBrains Mono', monospace; font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase; color: ${P.bg}; background: ${P.brand}; padding: 5px 10px; border-radius: 999px; margin-bottom: 16px; }
    .v1d .promo-card h3 { font-family: 'Cormorant Garamond', serif; font-size: 30px; font-weight: 500; margin: 0 0 10px; line-height: 1.1; color: ${P.ink}; }
    .v1d .promo-card p { font-size: 14px; line-height: 1.55; color: ${P.muted}; margin: 0; }

    .v1d section.pad { padding: 96px 64px; }
    .v1d .eyebrow { font-size: 11px; text-transform: uppercase; letter-spacing: 0.22em; margin-bottom: 16px; }
    .v1d .steps { display: grid; grid-template-columns: repeat(4, 1fr); gap: 48px; }
    .v1d .step { padding-top: 28px; border-top: 1px solid ${P.brand}55; }

    .v1d section.menu { padding: 96px 64px; background: ${P.paper}; }
    .v1d .menu-head { display: flex; align-items: flex-end; justify-content: space-between; margin-bottom: 56px; flex-wrap: wrap; gap: 16px; }
    .v1d .menu-cat { display: grid; grid-template-columns: 320px 1fr; gap: 64px; align-items: flex-start; margin-bottom: 96px; }
    .v1d .menu-cat-img { aspect-ratio: 4/5; overflow: hidden; border-radius: 2px; border: 1px solid ${P.line}; margin-top: 24px; }
    .v1d .menu-cat-img img { width: 100%; height: 100%; object-fit: cover; filter: saturate(0.95); }
    .v1d .menu-cat-title { font-size: 56px; margin-top: 0; font-style: italic; }
    .v1d .menu-cat-meta { font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase; }
    .v1d .menu-cat-note { font-size: 12px; line-height: 1.55; color: ${P.muted}; margin: 16px 0 0; max-width: 240px; }
    .v1d .menu-cat-note .star { font-size: 13px; margin-right: 4px; }
    .v1d .menu-row { display: grid; grid-template-columns: 1fr auto; gap: 24px; padding: 24px 0; border-bottom: 1px solid ${P.line}; align-items: baseline; }
    .v1d .menu-row-head { display: flex; align-items: baseline; gap: 12px; flex-wrap: wrap; }
    .v1d .menu-row-name { font-size: 32px; margin: 0; font-weight: 500; }
    .v1d .menu-row-tag { font-size: 10px; letter-spacing: 0.18em; }
    .v1d .menu-row-desc { font-size: 14px; line-height: 1.5; margin: 0; }
    .v1d .menu-foot { padding-top: 24px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; }

    .v1d .story-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 80px; align-items: center; }
    .v1d .story-img { aspect-ratio: 4/5; overflow: hidden; border-radius: 2px; border: 1px solid ${P.line}; }
    .v1d .story-img img { width: 100%; height: 100%; object-fit: cover; }

    .v1d .reviews { display: grid; grid-template-columns: repeat(3, 1fr); gap: 32px; }
    .v1d .review { padding: 32px 0; border-top: 1px solid ${P.brand}55; }
    .v1d .review p { font-size: 26px; font-style: italic; line-height: 1.3; margin: 0 0 20px; }

    .v1d section.cta-final { background: ${P.brand}; color: ${P.bg}; padding: 120px 64px; text-align: center; }
    .v1d section.cta-final h2 { font-size: 110px; line-height: 0.95; margin: 0 0 32px; letter-spacing: -0.03em; color: ${P.bg}; }
    .v1d .cta-final-btn { display: inline-flex; align-items: center; gap: 10px; padding: 22px 40px; background: ${P.bg}; color: ${P.brand}; border-radius: 999px; font-weight: 600; font-size: 16px; letter-spacing: 0.06em; text-transform: uppercase; text-decoration: none; border: 1px solid ${P.bg}; transition: background .25s ease, color .25s ease, transform .25s ease, box-shadow .25s ease; }
    .v1d .cta-final-btn:hover { background: ${P.accent}; color: ${P.bg}; border-color: ${P.accent}; transform: translateY(-2px); box-shadow: 0 12px 28px rgba(0,0,0,.28); }
    .v1d .cta-final .sub { font-size: 11px; color: ${P.bg}aa; letter-spacing: 0.18em; text-transform: uppercase; }

    .v1d footer.site { padding: 40px 64px; border-top: 1px solid ${P.line}; display: flex; justify-content: space-between; flex-wrap: wrap; gap: 16px; font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; background: ${P.bg}; color: ${P.muted}; font-family: 'JetBrains Mono', monospace; }

    @media (max-width: 860px) {
      .v1d header.site { padding: 18px 22px; }
      .v1d nav.site { display: none; }
      .v1d .rule { margin: 0 22px; }
      .v1d section.hero { padding: 40px 22px 56px; }
      .v1d .hero-grid { display: block; }
      .v1d .hero h1 { font-size: 56px; }
      .v1d .hero-lead { font-size: 15px; max-width: 100%; }
      .v1d .hero-stats { display: none; }
      .v1d .hero-card-wrap { margin-top: 40px; }
      .v1d .hero-card .cap { bottom: 20px; left: 20px; right: 20px; }
      .v1d section.pad, .v1d section.menu, .v1d section.promos { padding: 48px 22px; }
      .v1d .promo-grid { grid-template-columns: 1fr; gap: 16px; }
      .v1d .steps { grid-template-columns: 1fr; gap: 24px; }
      .v1d .menu-head h2 { font-size: 44px !important; }
      .v1d .menu-cat { grid-template-columns: 1fr; gap: 24px; }
      .v1d .menu-cat-title { font-size: 40px; }
      .v1d .menu-row { grid-template-columns: 1fr auto; gap: 12px; padding: 20px 0; }
      .v1d .menu-row-name { font-size: 26px; }
      .v1d .menu-row-desc { font-size: 13px; margin-top: 6px; }
      .v1d .story-grid { grid-template-columns: 1fr; gap: 32px; }
      .v1d .reviews { grid-template-columns: 1fr; gap: 24px; }
      .v1d section.cta-final { padding: 64px 22px; }
      .v1d section.cta-final h2 { font-size: 52px; }
      .v1d .cta { padding: 14px 22px; font-size: 13px; }
      .v1d .price { font-size: 28px; }
    }
  `;

  const WaIcon = (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.5 14.4c-.3-.1-1.7-.8-2-.9s-.5-.1-.7.1c-.2.3-.7.9-.9 1.1-.2.2-.3.2-.6.1-1.5-.8-2.6-1.4-3.6-3.1-.3-.5.3-.5.8-1.5.1-.2.1-.3 0-.5s-.7-1.6-.9-2.2c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.4s1 2.8 1.2 3c.1.2 2 3 4.8 4.2 1.8.8 2.5.9 3.4.7.5-.1 1.7-.7 1.9-1.3.2-.7.2-1.2.2-1.3-.1-.2-.3-.3-.6-.4z" />
      <path d="M21.1 4.9C19 2.8 16.1 1.6 13 1.6 6.7 1.6 1.6 6.7 1.6 13c0 2 .5 4 1.6 5.7L1.5 24l5.4-1.4c1.7.9 3.6 1.4 5.6 1.4h.1c6.3 0 11.4-5.1 11.4-11.4-.1-3-1.3-5.9-3.4-7.7zM13 22.4h-.1c-1.8 0-3.5-.5-5-1.4l-.4-.2-3.2.8.9-3.1-.2-.4c-1-1.6-1.5-3.4-1.5-5.2 0-5.4 4.4-9.8 9.8-9.8 2.6 0 5.1 1 6.9 2.9s2.9 4.3 2.9 6.9c-.1 5.3-4.5 9.5-9.8 9.5z" />
    </svg>
  );

  return (
    <div className="v1d">
      <style dangerouslySetInnerHTML={{ __html: css }} />

      {/* Header */}
      <header className="site">
        <BWLogo height={56} />
        <nav className="site">
          <a className="nav" href="#menu">Menú</a>
          <a className="nav" href="#como">Cómo pedir</a>
          <a className="nav" href="#historia">Obrador</a>
          <a className="nav" href="#contacto">Contacto</a>
        </nav>
        <Link href="/crm" className="crm-btn">Acceso CRM →</Link>
      </header>

      {/* Hero */}
      <section className="hero">
        <div className="hero-grid">
          <div>
            <div className="pill" style={{ marginBottom: 32 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: P.brand }} />
              Hoy en obrador · {BRAND.scheduleShort}
            </div>
            <h1 className="display">
              Waffles<br />
              <span style={{ fontStyle: 'italic' }}>hechos a mano</span><br />
              <span className="brand">en Loja.</span>
            </h1>
            <p className="muted hero-lead">
              El mejor waffle de Loja no está en ningún local. Está en camino a tu casa.{' '}
              Ingredientes frescos, <em style={{ color: P.brand, fontStyle: 'normal', fontWeight: 600 }}>los mejores de la city</em>{' '}
              — listos para llegar donde estás.
            </p>
            <div className="hero-ctas">
              <a href={waLink()} target="_blank" rel="noopener" className="cta">
                {WaIcon} Pedir por WhatsApp
              </a>
              <a href="#menu" className="cta alt">Ver el menú</a>
            </div>
            <div className="hero-stats">
              <div><div className="display brand num">14</div><div className="mono muted lbl">Sabores en carta</div></div>
              <div><div className="display brand num">30′</div><div className="mono muted lbl">Entrega promedio</div></div>
              <div><div className="display brand num">100%</div><div className="mono muted lbl">Recién hechos</div></div>
            </div>
          </div>
          <div className="hero-card-wrap">
            <div className="hero-card">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={HERO_IMG.hero} alt="" />
              <div className="grad" />
              <div className="cap">
                <div className="mono" style={{ fontSize: 10, color: P.brandSoft, letterSpacing: '0.18em', textTransform: 'uppercase' }}>Top del mes</div>
                <div className="display" style={{ fontSize: 48, lineHeight: 1, marginTop: 6 }}>
                  King Kong <span style={{ color: P.brandSoft, fontSize: 30 }}>$4.75</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <hr className="rule" />

      {/* Promociones — solo se renderiza si hay promos públicas vigentes */}
      {promos.length > 0 && (
        <section className="promos" id="promos">
          <div className="promos-head">
            <div className="mono brand eyebrow" style={{ marginBottom: 0 }}>— Promos del obrador</div>
            <h2 className="display" style={{ fontSize: 48, lineHeight: 1, margin: 0 }}>
              Hoy <span style={{ fontStyle: 'italic' }} className="brand">de regalo.</span>
            </h2>
          </div>
          <div className="promo-grid">
            {promos.map((pr) => (
              <div key={pr.id} className="promo-card">
                <span className="promo-badge">Promo</span>
                <h3>{pr.name}</h3>
                {pr.description && <p>{pr.description}</p>}
              </div>
            ))}
          </div>
          <div style={{ marginTop: 32, textAlign: 'right' }}>
            <a href={waLink('Hola Bacon Waffles, quiero aprovechar una promo 🎁')} target="_blank" rel="noopener" className="cta">
              Pedir con promo →
            </a>
          </div>
        </section>
      )}

      {/* Cómo pedir */}
      <section className="pad" id="como">
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <div className="mono brand eyebrow">— Cómo pedir</div>
          <h2 className="display" style={{ fontSize: 64, lineHeight: 1, margin: 0 }}>
            Cuatro pasos. <span style={{ fontStyle: 'italic' }} className="brand">Cero filas.</span>
          </h2>
        </div>
        <div className="steps">
          {STEPS.map((s) => (
            <div key={s.n} className="step">
              <div className="mono brand" style={{ fontSize: 11, letterSpacing: '0.22em', marginBottom: 16 }}>0{s.n}</div>
              <h3 className="display" style={{ fontSize: 30, margin: '0 0 12px', lineHeight: 1.1 }}>{s.t}</h3>
              <p className="muted" style={{ fontSize: 14, lineHeight: 1.6, margin: 0 }}>{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      <hr className="rule" />

      {/* Menú */}
      <section className="menu" id="menu">
        <div className="menu-head">
          <div>
            <div className="mono brand eyebrow">— Carta del obrador</div>
            <h2 className="display" style={{ fontSize: 72, lineHeight: 1, margin: 0 }}>El menú.</h2>
          </div>
          <div className="mono muted" style={{ fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase' }}>
            Precios en USD · IVA incluido
          </div>
        </div>

        <MenuCategory
          label="Dulces"
          index={1}
          img={HERO_IMG.dulce}
          items={menu.dulces}
          note="Las estrellas marcan el dulzor: 1 = suave, 5 = muy dulce."
        />
        <div
          className="mono brand"
          style={{
            fontSize: 14,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            fontWeight: 500,
            textAlign: 'right',
            marginTop: -64,
            marginBottom: 96,
          }}
        >
          + Bola de helado para cualquier waffle · $1.00
        </div>
        <MenuCategory label="Salados" index={2} img={HERO_IMG.salado} items={menu.salados} />
        <MenuCategory label="Combos" index={3} img={HERO_IMG.combo} items={menu.combos} />
        <MenuCategory label="Bebidas" index={4} img={HERO_IMG.bebida} items={menu.bebidas} />

        <div className="menu-foot" style={{ justifyContent: 'flex-end' }}>
          <a href={waLink()} target="_blank" rel="noopener" className="cta">Pedir ahora →</a>
        </div>
      </section>

      {/* Historia */}
      <section className="pad" id="historia">
        <div className="story-grid">
          <div className="story-img">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={HERO_IMG.story} alt="obrador" />
          </div>
          <div>
            <div className="mono brand eyebrow">— El obrador</div>
            <h2 className="display" style={{ fontSize: 56, lineHeight: 1.05, margin: '0 0 24px' }}>
              Una receta, <span style={{ fontStyle: 'italic' }} className="brand">cocinada cada día</span> en Loja.
            </h2>
            <p className="muted" style={{ fontSize: 17, lineHeight: 1.7, margin: '0 0 16px' }}>
              Trabajamos con masa belga de fermentación lenta y cocinamos cada cono al pedido. Sin local físico, sin congelado — el waffle sale del molde directo a la caja del rider.
            </p>
            <p className="muted" style={{ fontSize: 17, lineHeight: 1.7, margin: 0 }}>
              Atendemos a toda la ciudad de Loja de lunes a domingo, todos los días del año.
            </p>
          </div>
        </div>
      </section>

      <hr className="rule" />

      {/* Reseñas */}
      <section className="pad">
        <div className="mono brand eyebrow">— Comentarios</div>
        <h2 className="display" style={{ fontSize: 56, lineHeight: 1, margin: '0 0 48px' }}>Lo que dicen.</h2>
        <div className="reviews">
          {reviews.map((r, i) => (
            <div key={i} className="review">
              <div className="star" style={{ fontSize: 14, letterSpacing: 3, marginBottom: 16 }}>{'★'.repeat(r.s)}</div>
              <p className="display">“{r.t}”</p>
              <div className="mono muted" style={{ fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase' }}>— {r.n}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA final */}
      <section className="cta-final" id="contacto">
        <div className="mono sub" style={{ marginBottom: 24 }}>— Hambre ahora</div>
        <h2 className="display">
          ¿Pedimos uno<br /><span style={{ fontStyle: 'italic', opacity: 0.85 }}>ahora mismo?</span>
        </h2>
        <a href={waLink()} target="_blank" rel="noopener" className="cta-final-btn">
          Escribir a WhatsApp · {BRAND.whatsappDisplay}
        </a>
        <div className="mono sub" style={{ marginTop: 32 }}>
          {BRAND.scheduleShort} · Cobertura toda Loja
        </div>
      </section>

      {/* Footer */}
      <footer className="site">
        <div>© 2026 Bacon Waffles · {BRAND.instagram}</div>
        <div>{BRAND.whatsappDisplay} · Loja, Ecuador</div>
      </footer>
    </div>
  );
}
