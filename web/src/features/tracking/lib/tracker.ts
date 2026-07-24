import { supabase } from '@/shared/lib/supabase';

const SESSION_KEY = 'peladinhas.tracking.session';

/** Strips UUIDs and numeric ids from a path — only the route is stored, never the entity. */
export function normalizePath(pathname: string): string {
  return (
    pathname
      .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, ':id')
      .replace(/\/\d+(?=\/|$)/g, '/:id')
      .replace(/\/$/, '')
      .slice(0, 200) || '/'
  );
}

/** Classifies device category by screen width only (no user-agent, no fingerprinting). */
export function deviceOf(width: number): 'telemóvel' | 'tablet' | 'desktop' {
  if (width < 640) return 'telemóvel';
  if (width < 1024) return 'tablet';
  return 'desktop';
}

interface Session {
  id: string;
  started: boolean;
}

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

/** Logs a page view (and session start, on the first one). */
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
  if (!session.started) flushNow();
}

/** Flushes the queue immediately (e.g. when leaving the page). */
export function flushNow() {
  if (timer) clearTimeout(timer);
  void flush().catch(() => {});
}
