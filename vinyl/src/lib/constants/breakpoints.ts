/**
 * Responsive Breakpoints
 */

export const BREAKPOINTS = {
	mobile: 768,
	tablet: 1024,
	desktop: 1440,
	wide: 1920
} as const;

export type Breakpoint = keyof typeof BREAKPOINTS;

/**
 * Check if current width matches breakpoint
 */
export function isBreakpoint(width: number, breakpoint: Breakpoint): boolean {
	return width >= BREAKPOINTS[breakpoint];
}
