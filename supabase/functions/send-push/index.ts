// Edge Function: send-push
// -----------------------------------------------------------------------------
// Chamada pelo trigger `notification_push` (Postgres, via pg_net) sempre que
// nasce um aviso em `notification`. Envia Web Push a cada dispositivo inscrito
// do jogador; subscrições mortas (404/410) são apagadas.
//
// Autenticação: segredo partilhado (não JWT — quem chama é o Postgres do
// próprio projeto, via pg_net, não um utilizador). `verify_jwt = false` em
// `config.toml`, como a `health`.
// Deploy: `supabase functions deploy send-push` (feito pelo workflow de CD).
// -----------------------------------------------------------------------------

import webpush from 'npm:web-push@3.6.7';
import { createClient } from 'npm:@supabase/supabase-js@2';

const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY') ?? '';
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY') ?? '';
const VAPID_SUBJECT = Deno.env.get('VAPID_SUBJECT') ?? '';
const PUSH_SHARED_SECRET = Deno.env.get('PUSH_SHARED_SECRET') ?? '';

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
);

interface NotificationPayload {
  user_id: string;
  title: string;
  body: string | null;
  data: Record<string, unknown>;
}

Deno.serve(async (req) => {
  if (req.headers.get('authorization') !== `Bearer ${PUSH_SHARED_SECRET}`) {
    return new Response('unauthorized', { status: 401 });
  }

  const payload = (await req.json()) as NotificationPayload;

  const { data: subs, error } = await supabase
    .from('push_subscription')
    .select('id, endpoint, p256dh, auth_key')
    .eq('user_id', payload.user_id);

  if (error) {
    return new Response(error.message, { status: 500 });
  }

  const message = JSON.stringify({
    title: payload.title,
    body: payload.body,
    data: payload.data,
  });

  await Promise.all(
    (subs ?? []).map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth_key } },
          message,
        );
      } catch (err) {
        const statusCode = (err as { statusCode?: number }).statusCode;
        if (statusCode === 404 || statusCode === 410) {
          await supabase.from('push_subscription').delete().eq('id', sub.id);
        }
      }
    }),
  );

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
});
