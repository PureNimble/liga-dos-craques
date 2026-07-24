import { useContext } from 'react';
import { OnlineCountContext } from '../components/onlinePresence';

/** Number of users currently online, via realtime presence. */
export function useOnlineCount(): number {
  return useContext(OnlineCountContext);
}
