import { BrowserRouter } from 'react-router';
import { RepositoryProvider } from '@/storage';
import { AppRoutes } from './AppRoutes';

/**
 * Application root. Uses HTML5 history routing; the host must serve index.html
 * for unknown paths (Vite dev and preview do). Hosting is decided in Milestone 10 (D12).
 */
export function App() {
  return (
    <RepositoryProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </RepositoryProvider>
  );
}
