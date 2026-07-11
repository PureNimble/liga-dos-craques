import { ConnectionStatus } from '@/features/health/ConnectionStatus';

export function HomePage() {
  return (
    <main className="mx-auto flex min-h-full max-w-lg flex-col justify-center gap-6 p-6">
      <header className="text-center">
        <h1 className="text-4xl font-black tracking-tight">Peladinhas ⚽</h1>
        <p className="mt-2 text-slate-500">
          Jogos, estatísticas, rankings, desafios e evolução — entre amigos.
        </p>
      </header>

      <ConnectionStatus />

      <footer className="text-center text-xs text-slate-400">
        F0 · Fundações — esqueleto ponta-a-ponta
      </footer>
    </main>
  );
}
