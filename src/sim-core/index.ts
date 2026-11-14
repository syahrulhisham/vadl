/**
 * Public surface of the simulation core. UI code imports from `@/sim-core`,
 * never from deep paths, so the core can be reorganised without breaking callers.
 */
export type * from './types';
export * from './units';
export * from './engine';
export * from './equations';
export * from './models';
