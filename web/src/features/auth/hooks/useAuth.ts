import { useContext } from 'react';
import { AuthContext, type AuthContextValue } from '../components/AuthProvider';

/** Reads the current auth session from context; throws outside an `AuthProvider`. */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth deve ser usado dentro de <AuthProvider>');
  }
  return ctx;
}
