/**
 * Public surface of the simulation core. UI code imports from `@/sim-core`,
 * never from deep paths, so the core can be reorganised without breaking callers.
 *
 * Milestone 1 contains only the contracts and the units module. The engine
 * (clock, Euler, RK4, recorder) arrives in Milestone 3; equations and models
 * arrive with their laboratories from Milestone 4.
 */
export type * from './types';
export * from './units';
