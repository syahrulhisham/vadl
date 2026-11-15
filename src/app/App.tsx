import { BrowserRouter } from 'react-router';
import { RepositoryProvider } from '@/storage';
import { AppRoutes } from './AppRoutes';
import { basenameFrom } from './basename';

/**
 * Application root. Uses HTML5 history routing under the build's base path; the
 * host must serve index.html for unknown paths (Vite dev and preview do; see
 * docs/guides/deployment.md for static hosts).
 */
export function App() {
  return (
    <RepositoryProvider>
      <BrowserRouter basename={basenameFrom(import.meta.env.BASE_URL)}>
        <AppRoutes />
      </BrowserRouter>
    </RepositoryProvider>
  );
}
