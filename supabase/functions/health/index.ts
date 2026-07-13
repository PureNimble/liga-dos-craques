// Edge Function: health
// -----------------------------------------------------------------------------
// Endpoint público e leve usado por:
//   1. Keep-alive (GitHub Actions cron + UptimeRobot) para manter o projeto
//      Supabase gratuito acordado (evita a suspensão por inatividade ~7 dias).
//   2. Monitorização externa de uptime.
//
// Não acede a dados sensíveis. Responde sempre 200 com um pequeno JSON.
// Deploy: `supabase functions deploy health` (feito pelo workflow de CD).
// -----------------------------------------------------------------------------

Deno.serve(() => {
  const body = {
    status: 'ok',
    service: 'peladinhas',
    timestamp: new Date().toISOString(),
  };

  return new Response(JSON.stringify(body), {
    status: 200,
    headers: {
      'content-type': 'application/json',
      'cache-control': 'no-store',
    },
  });
});
