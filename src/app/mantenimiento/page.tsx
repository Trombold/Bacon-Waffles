import { BRAND, waLink } from '@/lib/data';
import { PALETTE_D as P } from '@/lib/theme';
import { BWWordmark, WaIcon, Stamp } from '@/components/brand-bits';

export const metadata = { title: 'En mantenimiento — Bacon Waffles' };

export default function Mantenimiento() {
  const css = `
    .mnt { background: ${P.bg}; color: ${P.ink}; font-family: 'Manrope', system-ui, sans-serif; min-height: 100vh; display: flex; flex-direction: column; }
    .mnt .display { font-family: 'Cormorant Garamond', 'Times New Roman', serif; font-weight: 500; letter-spacing: -0.02em; }
    .mnt .mono { font-family: 'JetBrains Mono', ui-monospace, monospace; letter-spacing: 0.04em; }
    .mnt header { display: flex; align-items: center; justify-content: center; padding: 28px; border-bottom: 1px solid ${P.line}; }
    .mnt main { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 56px 24px; max-width: 720px; margin: 0 auto; }
    .mnt .eyebrow { font-family: 'JetBrains Mono', monospace; font-size: 46px; line-height: 1.05; color: ${P.brand}; letter-spacing: 0.01em; text-transform: uppercase; margin-bottom: 18px; }
    .mnt h1 { font-size: 64px; line-height: 1.02; margin: 0 0 24px; }
    .mnt p.lead { color: ${P.muted}; font-size: 18px; line-height: 1.7; max-width: 520px; margin: 0 0 40px; }
    .mnt .info { display: flex; gap: 48px; justify-content: center; flex-wrap: wrap; margin-bottom: 40px; padding: 28px 0; border-top: 1px solid ${P.line}; border-bottom: 1px solid ${P.line}; width: 100%; max-width: 520px; }
    .mnt .info .k { font-family: 'JetBrains Mono', monospace; font-size: 10px; color: ${P.muted}; letter-spacing: 0.2em; text-transform: uppercase; margin-bottom: 8px; }
    .mnt .info .v { font-family: 'Cormorant Garamond', serif; font-size: 24px; color: ${P.brand}; }
    .mnt .cta { display: inline-flex; align-items: center; gap: 10px; padding: 18px 30px; background: ${P.brand}; color: ${P.bg}; border-radius: 999px; font-weight: 600; font-size: 14px; letter-spacing: 0.06em; text-transform: uppercase; text-decoration: none; transition: background .25s ease, transform .25s ease, box-shadow .25s ease; }
    .mnt .cta:hover { background: ${P.accent}; transform: translateY(-2px); box-shadow: 0 10px 24px ${P.accent}3d; }
    .mnt .stamp { margin-top: 48px; }
    .mnt .obrador { margin-top: 18px; font-family: 'JetBrains Mono', monospace; font-size: 11px; color: ${P.muted}; letter-spacing: 0.16em; text-transform: uppercase; }
    .mnt footer { padding: 28px 64px; border-top: 1px solid ${P.line}; display: flex; justify-content: space-between; flex-wrap: wrap; gap: 12px; font-family: 'JetBrains Mono', monospace; font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; color: ${P.muted}; }

    @media (max-width: 760px) {
      .mnt .eyebrow { font-size: 28px; }
      .mnt h1 { font-size: 42px; }
      .mnt p.lead { font-size: 15px; }
      .mnt .info { gap: 32px; }
      .mnt footer { padding: 22px; justify-content: center; }
    }
  `;

  return (
    <div className="mnt">
      <style dangerouslySetInnerHTML={{ __html: css }} />

      <header>
        <BWWordmark height={52} />
      </header>

      <main>
        <div className="eyebrow">— En mantenimiento</div>
        <h1 className="display">
          Volvemos <span style={{ fontStyle: 'italic', color: P.brand }}>pronto.</span>
        </h1>
        <p className="lead">
          Estamos limpiando el molde. Hacemos unos ajustes para que pedir tu waffle sea aún más fácil.
          La web vuelve en un ratito — pero el obrador sigue encendido.
        </p>

        <div className="info">
          <div>
            <div className="k">Horario</div>
            <div className="v display">Lun – Vie · 10–22h</div>
          </div>
          <div>
            <div className="k">Entrega</div>
            <div className="v display">Toda Loja</div>
          </div>
        </div>

        <a href={waLink()} target="_blank" rel="noopener" className="cta">
          {WaIcon} Pedir mientras tanto
        </a>

        <div className="stamp">
          <Stamp id="stamp-mnt" text="VOLVEMOS · EN · BREVE · " size={132} />
        </div>
        <div className="obrador">El obrador no para · Cocinando al momento</div>
      </main>

      <footer>
        <div>© 2026 Bacon Waffles · Loja</div>
        <div>{BRAND.whatsappDisplay}</div>
      </footer>
    </div>
  );
}
