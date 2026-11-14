/**
 * Design system: tokens, contrast utilities and the shared UI components every
 * page and laboratory uses. Components carry the accessibility and legibility
 * rules (NFR-03, NFR-04, NFR-10) so modules do not re-implement them.
 */
export { colors, TEXT_PAIRS } from './tokens';
export { contrastRatio, relativeLuminance, parseHex } from './contrast';
export { Icon, type IconName } from './Icon';
export { Button, LinkButton } from './Button';
export { buttonClasses, type ButtonVariant } from './buttonClasses';
export { Panel } from './Panel';
export { PageHeader } from './PageHeader';
export { StatusBadge, type StatusTone } from './StatusBadge';
export { MeasurementDisplay } from './MeasurementDisplay';
export { NumberControl } from './NumberControl';
export { validateNumber, type Validation } from './validateNumber';
