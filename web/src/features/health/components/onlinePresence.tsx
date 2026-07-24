import { createContext, useEffect, useState, type ReactNode } from 'react';
import { supabase } from '@/shared/lib/supabase';

// eslint-disable-next-line react-refresh/only-export-components
export const OnlineCountContext = createContext(0);

/** Tracks the current user's realtime presence and exposes the live online count to children. */
export function OnlinePresenceProvider({
  userId,
  children,
}: {
  userId: string;
  children: ReactNode;
}) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const channel = supabase.channel('online', {
      config: { presence: { key: userId } },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        setCount(Object.keys(channel.presenceState()).length);
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          void channel.track({ online_at: new Date().toISOString() });
        }
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId]);

  return <OnlineCountContext.Provider value={count}>{children}</OnlineCountContext.Provider>;
}
