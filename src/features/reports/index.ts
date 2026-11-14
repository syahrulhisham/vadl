/**
 * Laboratory report model, print layout and PDF export via the browser's print
 * dialog (FR-13, decision D7). Thin version in Milestone 4, complete in Milestone 9.
 */
export * from './types';
export { EMPTY_DRAFT, type ReportDefinition, type ReportDraft } from './definition';
export { graphPoints, summariseAttempts, type AttemptSummary } from './reportData';
export { ReportView, type ReportViewProps } from './ReportView';
