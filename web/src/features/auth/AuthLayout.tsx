import type { ReactNode } from 'react';
import { BallIcon } from '@/components/ui/icons';

/** Moldura comum a todas as páginas de autenticação. */
export function AuthLayout({ title, children }: { title: string; children: ReactNode }) {
  return (
    <main className="relative mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 p-6">
      {/* Brilho decorativo de fundo */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[radial-gradient(ellipse_at_top,theme(colors.pitch.500/0.15),transparent_70%)]"
      />

      <header className="relative text-center">
        <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-pitch-500 text-navy-975 shadow-glow">
          <BallIcon width={30} height={30} />
        </span>
        <h1 className="text-3xl font-black tracking-tight text-white">Peladinhas</h1>
        <p className="mt-1 text-sm text-slate-400">{title}</p>
      </header>

      <div className="relative flex flex-col gap-5 rounded-2xl border border-white/[0.07] bg-gradient-to-b from-navy-850/70 to-navy-900 p-6 shadow-elevated">
        {children}
      </div>
    </main>
  );
}
