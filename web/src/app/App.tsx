import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router-dom';
import { queryClient } from '@/shared/lib/queryClient';
import { AuthProvider } from '@/features/auth/components/AuthProvider';
import { ToastProvider } from '@/shared/components/toast/ToastProvider';
import { ConfirmProvider } from '@/shared/components/ui/ConfirmDialog';
import { ThemeProvider } from '@/shared/theme/ThemeProvider';
import { I18nProvider } from '@/shared/i18n/I18nProvider';
import { i18nRegistry } from './lib/i18nRegistry';
import { router } from './router';

export function App() {
  return (
    <ThemeProvider>
      <I18nProvider dictionary={i18nRegistry}>
        <QueryClientProvider client={queryClient}>
          <ToastProvider>
            <ConfirmProvider>
              <AuthProvider>
                <RouterProvider router={router} />
              </AuthProvider>
            </ConfirmProvider>
          </ToastProvider>
        </QueryClientProvider>
      </I18nProvider>
    </ThemeProvider>
  );
}
