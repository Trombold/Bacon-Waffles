import Link from 'next/link';
import { BRAND, HERO_IMG, waLink } from '@/lib/data';
import { PALETTE_D as P } from '@/lib/theme';
import { BWWordmark, WaIcon, Stamp } from '@/components/brand-bits';

export default function NotFound() {
  const css = `
    .err { background: ${P.bg}; color: ${P.ink}; font-family: 'Manrope', system-ui, sans-serif; min-height: 100vh; display: flex; flex-direction: column; }
    .err .display { font-family: 'Cormorant Garamond', 'Times New Roman', serif; font-weight: 500; letter-spacing: -0.02em; }
    .err .mono { font-family: 'JetBrains Mono', ui-monospace, monospace; letter-spacing: 0.04em; }
    .err header { display: flex; align-items: center; justify-content: space-between; padding: 24px 64px; border-bottom: 1px solid ${P.line}; }
    .err .wa { display: inline-flex; align-items: center; gap: 8px; font-family: 'JetBrains Mono', monospace; font-size: 11px; padding: 9px 16px; border: 1px solid ${P.brand}55; border-radius: 999px; color: ${P.brand}; text-decoration: none; letter-spacing: 0.14em; text-transform: uppercase; background: ${P.paper}; transition: background .25s ease, color .25s ease, border-color .25s ease; }
    .err .wa:hover { background: ${P.brand}; color: ${P.bg}; border-color: ${P.brand}; }
    .err main { flex: 1; display: grid; grid-template-columns: 1.1fr 0.9fr; gap: 64px; align-items: center; padding: 72px 64px; max-width: 1440px; margin: 0 auto; width: 100%; }
    .err .eyebrow { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: ${P.brand}; letter-spacing: 0.22em; text-transform: uppercase; margin-bottom: 20px; }
    .err .big { font-family: 'Cormorant Garamond', serif; font-size: 200px; line-height: 0.85; font-weight: 500; color: ${P.brand}; letter-spacing: -0.04em; margin: 0 0 8px; }
    .err h1 { font-size: 46px; line-height: 1.05; margin: 0 0 20px; }
    .err p.lead { color: ${P.muted}; font-size: 18px; line-height: 1.65; max-width: 460px; margin: 0 0 32px; }
    .err .ctas { display: flex; gap: 12px; flex-wrap: wrap; }
    .err .cta { display: inline-flex; align-items: center; gap: 10px; padding: 16px 26px; border-radius: 999px; font-weight: 600; font-size: 14px; letter-spacing: 0.06em; text-transform: uppercase; text-decoration: none; transition: background .25s ease, color .25s ease, transform .25s ease, box-shadow .25s ease, border-color .25s ease; }
    .err .cta.primary { background: ${P.brand}; color: ${P.bg}; }
    .err .cta.primary:hover { background: ${P.accent}; transform: translateY(-2px); box-shadow: 0 10px 24px ${P.accent}3d; }
    .err .cta.alt { background: transparent; color: ${P.ink}; border: 1px solid ${P.ink}40; }
    .err .cta.alt:hover { color: ${P.accent}; border-color: ${P.accent}; }
    .err .aside { position: relative; display: flex; flex-direction: column; align-items: center; gap: 24px; }
    .err .card { position: relative; width: 100%; aspect-ratio: 4/5; border-radius: 4px; overflow: hidden; border: 1px solid ${P.line}; }
    .err .card img { width: 100%; height: 100%; object-fit: cover; filter: brightness(.9) saturate(.95); }
    .err .card .grad { position: absolute; inset: 0; background: linear-gradient(180deg, transparent 45%, ${P.bg}e6 100%); }
    .err .card .cap { position: absolute; left: 24px; right: 24px; bottom: 24px; }
    .err .stamp-wrap { position: absolute; top: -34px; right: -10px; }
    .err footer { padding: 28px 64px; border-top: 1px solid ${P.line}; display: flex; justify-content: space-between; flex-wrap: wrap; gap: 12px; font-family: 'JetBrains Mono', monospace; font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; color: ${P.muted}; }

    @media (max-width: 760px) {
      .err header { padding: 18px 22px; }
      .err main { grid-template-columns: 1fr; gap: 40px; padding: 44px 22px; }
      .err .big { font-size: 120px; }
      .err h1 { font-size: 34px; }
      .err p.lead { font-size: 15px; }
      .err .aside { order: -1; }
      .err .stamp-wrap { top: -24px; right: -6px; transform: scale(.8); }
      .err footer { padding: 22px; }
    }
  `;

  return (
    <div className="err">
      <style dangerouslySetInnerHTML={{ __html: css }} />

      <header>
        <Link href="/" style={{ textDecoration: 'none' }}>
          <BWWordmark height={50} />
        </Link>
        <a href={waLink()} target="_blank" rel="noopener" className="wa">
          {WaIcon} Pedir por WhatsApp →
        </a>
      </header>

      <main>
        <div>
          <div className="eyebrow">— Error 404</div>
          <div className="big">404</div>
          <h1 className="display">
            Esta página <span style={{ fontStyle: 'italic', color: P.brand }}>se enfrió.</span>
          </h1>
          <p className="lead">
            El waffle que buscas no está en el molde. Quizá la dirección cambió o ya se lo comieron.
            Volvamos a la carta — ahí todo sale calientito.
          </p>
          <div className="ctas">
            <Link href="/" className="cta primary">
              Volver al inicio
            </Link>
            <Link href="/#menu" className="cta alt">
              Ver el menú
            </Link>
          </div>
        </div>

        <div className="aside">
          <div className="card">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={HERO_IMG.hero} alt="King Kong" />
            <div className="grad" />
            <div className="cap">
              <div className="mono" style={{ fontSize: 10, color: P.brandSoft, letterSpacing: '0.18em', textTransform: 'uppercase' }}>
                Mejor pide esto
              </div>
              <div className="display" style={{ fontSize: 34, lineHeight: 1, marginTop: 6, color: '#fff' }}>
                King Kong <span style={{ color: P.brandSoft, fontSize: 22 }}>$4.75</span>
              </div>
            </div>
            <div className="stamp-wrap">
              <Stamp id="stamp-404" text="RECIÉN · HECHO · EN LOJA · " size={108} />
            </div>
          </div>
        </div>
      </main>

      <footer>
        <div>© 2026 Bacon Waffles · Loja</div>
        <div>{BRAND.whatsappDisplay}</div>
      </footer>
    </div>
  );
}
