'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { login } from './actions';
import { CRM_THEME, CRM_THEME as C } from '@/lib/theme';

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, null);

  return (
    <div
      style={{
        minHeight: '100vh',
        background: C.bg,
        color: C.ink,
        fontFamily: 'Inter, system-ui, sans-serif',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 380,
          background: C.panel,
          border: `1px solid ${C.line}`,
          borderRadius: 16,
          padding: 32,
        }}
      >
        <div style={{ background: '#fff', borderRadius: 12, padding: '16px 18px', marginBottom: 14 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.jpeg" alt="Bacon Waffles" style={{ width: '100%', display: 'block' }} />
        </div>
        <div style={{ fontSize: 11, opacity: 0.6, letterSpacing: '0.12em', textTransform: 'uppercase', textAlign: 'center' }}>
          CRM · Acceso obrador
        </div>

        <p style={{ color: C.muted, fontSize: 13, margin: '16px 0 24px', lineHeight: 1.5 }}>
          Ingresa con tu cuenta de staff para gestionar pedidos, productos y clientes.
        </p>

        <form action={formAction} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <label style={{ fontSize: 12, color: C.muted, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Correo
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="admin@baconwaffles.ec"
              style={inputStyle(C)}
            />
          </label>
          <label style={{ fontSize: 12, color: C.muted, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Contraseña
            <input
              name="password"
              type="password"
              required
              autoComplete="current-password"
              placeholder="••••••••"
              style={inputStyle(C)}
            />
          </label>

          {state?.error && (
            <div style={{ color: C.red, fontSize: 13, background: `${C.red}22`, padding: '8px 12px', borderRadius: 8 }}>
              {state.error}
            </div>
          )}

          <button
            type="submit"
            disabled={pending}
            style={{
              marginTop: 6,
              height: 44,
              background: C.amber,
              color: C.bg,
              border: 0,
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 700,
              cursor: pending ? 'default' : 'pointer',
              opacity: pending ? 0.7 : 1,
            }}
          >
            {pending ? 'Entrando…' : 'Entrar al CRM'}
          </button>
        </form>

        <Link
          href="/"
          style={{ display: 'block', textAlign: 'center', marginTop: 20, color: C.muted, fontSize: 12, textDecoration: 'none' }}
        >
          ← Volver al sitio
        </Link>
      </div>
    </div>
  );
}

function inputStyle(C: typeof CRM_THEME): React.CSSProperties {
  return {
    marginTop: 6,
    width: '100%',
    height: 42,
    background: C.bg,
    color: C.ink,
    border: `1px solid ${C.line}`,
    borderRadius: 10,
    padding: '0 12px',
    fontSize: 14,
    fontFamily: 'inherit',
    textTransform: 'none',
    letterSpacing: 'normal',
  };
}
