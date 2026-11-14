import { lazy } from 'react';
import { Route, Routes } from 'react-router';
import { AppLayout } from './AppLayout';

/*
 * Every page is a separate lazily loaded chunk (architecture §6: lazy loading).
 * Pages that share a file are picked out by name.
 */
const WelcomePage = lazy(() => import('./pages/WelcomePage'));
const OverviewPage = lazy(() => import('./pages/OverviewPage'));
const ModulesPage = lazy(() => import('./pages/ModulesPage'));
const ModulePage = lazy(() => import('./pages/ModulePage'));
const RlCircuitPage = lazy(() => import('./pages/rl/RlCircuitPage'));
const info = () => import('./pages/InfoPages');
const ResourcesPage = lazy(() => info().then((m) => ({ default: m.ResourcesPage })));
const ActivitiesPage = lazy(() => info().then((m) => ({ default: m.ActivitiesPage })));
const AssessmentPage = lazy(() => info().then((m) => ({ default: m.AssessmentPage })));
const ProgressPage = lazy(() => import('./pages/ProgressPage'));
const ReportsPage = lazy(() => import('./pages/ReportsPage'));
const ReportPage = lazy(() => import('./pages/ReportPage'));
const NotFoundPage = lazy(() => info().then((m) => ({ default: m.NotFoundPage })));

/** All routes. Rendered inside a router: BrowserRouter in the app, MemoryRouter in tests. */
export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<WelcomePage />} />
        <Route path="overview" element={<OverviewPage />} />
        <Route path="modules" element={<ModulesPage />} />
        <Route path="modules/:slug" element={<ModulePage />} />
        <Route path="resources" element={<ResourcesPage />} />
        <Route path="resources/rl-circuit" element={<RlCircuitPage />} />
        <Route path="activities" element={<ActivitiesPage />} />
        <Route path="assessment" element={<AssessmentPage />} />
        <Route path="progress" element={<ProgressPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="reports/:moduleId" element={<ReportPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
