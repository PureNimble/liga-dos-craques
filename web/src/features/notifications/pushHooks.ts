import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared/lib/supabase';
import { env } from '@/shared/lib/env';

/** Suporte do browser a Web Push (e chave VAPID configurada). */
export const pushSupported =
  typeof window !== 'undefined' &&
  'serviceWorker' in navigator &&
  'PushManager' in window &&
  Boolean(env.VITE_VAPID_PUBLIC_KEY);

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const safe = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(safe);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

async function getRegistration(): Promise<ServiceWorkerRegistration> {
  return (
    (await navigator.serviceWorker.getRegistration('/sw.js')) ??
    navigator.serviceWorker.register('/sw.js')
  );
}

/** Se este browser/dispositivo já tem uma subscrição push ativa. */
export function usePushSubscriptionStatus() {
  return useQuery({
    queryKey: ['push_subscription_status'],
    enabled: pushSupported,
    queryFn: async (): Promise<boolean> => {
      const registration = await navigator.serviceWorker.getRegistration('/sw.js');
      const subscription = await registration?.pushManager.getSubscription();
      return Boolean(subscription);
    },
  });
}

/** Pede permissão, subscreve neste dispositivo e grava a subscrição no servidor. */
export function useEnablePush(userId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error('Sem sessão');

      const permission = await Notification.requestPermission();
      if (permission !== 'granted') throw new Error('Permissão de notificações recusada');

      const registration = await getRegistration();
      const subscription =
        (await registration.pushManager.getSubscription()) ??
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(env.VITE_VAPID_PUBLIC_KEY as string) as BufferSource,
        }));

      const json = subscription.toJSON();
      const endpoint = json.endpoint as string;

      // Reinscrever (mesmo endpoint) substitui a linha em vez de falhar por duplicado.
      await supabase.from('push_subscription').delete().eq('endpoint', endpoint);
      const { error } = await supabase.from('push_subscription').insert({
        user_id: userId,
        endpoint,
        p256dh: json.keys?.p256dh as string,
        auth_key: json.keys?.auth as string,
      });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['push_subscription_status'] }),
  });
}

/** Cancela a subscrição push neste dispositivo. */
export function useDisablePush() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const registration = await navigator.serviceWorker.getRegistration('/sw.js');
      const subscription = await registration?.pushManager.getSubscription();
      if (!subscription) return;

      const endpoint = subscription.endpoint;
      await subscription.unsubscribe();
      const { error } = await supabase.from('push_subscription').delete().eq('endpoint', endpoint);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['push_subscription_status'] }),
  });
}
