import { supabase } from '@/shared/lib/supabase';

const SESSION_KEY = 'peladinhas.tracking.session';

/** UUIDs e ids numéricos saem do caminho — guarda-se a rota, não a entidade. */
export function normalizePath(pathname: string): string {
  return (
    pathname
      .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, ':id')
      .replace(/\/\d+(?=\/|$)/g, '/:id')
      .replace(/\/$/, '')
      .slice(0, 200) || '/'
  );
}

/** Categoria do ecrã (só a largura, sem user-agent nem impressão digital). */
export function deviceOf(width: number): 'telemóvel' | 'tablet' | 'desktop' {
  if (width < 640) return 'telemóvel';
  if (width < 1024) return 'tablet';
  return 'desktop';
}

interface Session {
  id: string;
  started: boolean;
}

/** Sessão = separador aberto; morre com o `sessionStorage`. */
function currentSession(): Session {
  const stored = sessionStorage.getItem(SESSION_KEY);
  if (stored) return { id: stored, started: true };
  const id = crypto.randomUUID();
  sessionStorage.setItem(SESSION_KEY, id);
  return { id, started: false };
}

interface QueuedEvent {
  user_id: string;
  session_id: string;
  name: string;
  path: string | null;
  props: Record<string, string | number>;
}

let queue: QueuedEvent[] = [];
let timer: ReturnType<typeof setTimeout> | null = null;

/** Envia o que está em fila; falhas são silenciosas (tracking nunca parte a app). */
async function flush() {
  timer = null;
  const batch = queue;
  queue = [];
  if (batch.length === 0) return;
  await supabase.from('app_event').insert(batch);
}

function enqueue(event: QueuedEvent) {
  queue.push(event);
  if (timer) return;
  timer = setTimeout(() => {
    void flush().catch(() => {});
  }, 2000);
}

/** Regista uma visita de página (e o arranque da sessão, na primeira). */
export function trackPageView(userId: string, pathname: string) {
  const session = currentSession();
  const path = normalizePath(pathname);
  if (!session.started) {
    enqueue({
      user_id: userId,
      session_id: session.id,
      name: 'session_start',
      path,
      props: { device: deviceOf(window.innerWidth) },
    });
  }
  enqueue({
    user_id: userId,
    session_id: session.id,
    name: 'page_view',
    path,
    props: {},
  });
  // O arranque da sessão vai já: é o único evento sem segunda oportunidade se o
  // separador fechar ou recarregar antes do envio em lote.
  if (!session.started) flushNow();
}

/** Descarrega a fila imediatamente (ao sair da página). */
export function flushNow() {
  if (timer) clearTimeout(timer);
  void flush().catch(() => {});
}
