import { useContext } from 'react';
import { OnlineCountContext } from './onlinePresence';

/** Número de utilizadores online agora (presença em tempo real). */
export function useOnlineCount(): number {
  return useContext(OnlineCountContext);
}
