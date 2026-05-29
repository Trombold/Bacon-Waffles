import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { CRM_THEME as C } from '@/lib/theme';
import Sidebar from '@/components/crm/Sidebar';
import Topbar from '@/components/crm/Topbar';

export default async function CRMLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  return (
    <div
      style={{
        height: '100vh',
        background: C.bg,
        color: C.ink,
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: 14,
        display: 'flex',
        overflow: 'hidden',
      }}
    >
      <Sidebar email={user.email || 'admin@baconwaffles.ec'} />
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Topbar />
        <div style={{ flex: 1, padding: 28, overflow: 'auto' }}>{children}</div>
      </main>
    </div>
  );
}
