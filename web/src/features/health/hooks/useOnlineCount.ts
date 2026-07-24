import { useContext } from 'react';
import { OnlineCountContext } from '../components/onlinePresence';

/** Número de utilizadores online agora (presença em tempo real). */
export function useOnlineCount(): number {
  return useContext(OnlineCountContext);
}
