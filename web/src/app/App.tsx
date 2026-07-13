import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router-dom';
import { queryClient } from '@/shared/lib/queryClient';
import { AuthProvider } from '@/features/auth/AuthProvider';
import { ToastProvider } from '@/shared/components/toast/ToastProvider';
import { ConfirmProvider } from '@/shared/components/ui/ConfirmDialog';
import { router } from './router';

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <ConfirmProvider>
          <AuthProvider>
            <RouterProvider router={router} />
          </AuthProvider>
        </ConfirmProvider>
      </ToastProvider>
    </QueryClientProvider>
  );
}
