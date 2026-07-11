import { createBrowserRouter } from 'react-router-dom';
import { HomePage } from './pages/HomePage';

/**
 * Router da aplicação. Na F0 só existe a Home; as rotas de auth, perfil,
 * jogos, etc. são adicionadas nas fases seguintes.
 */
export const router = createBrowserRouter([
  {
    path: '/',
    element: <HomePage />,
  },
]);
