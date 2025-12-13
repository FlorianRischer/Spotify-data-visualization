/**
 * Physics Constants for Drag & Snap
 */

// Drag physics
export const DRAG_SENSITIVITY = 0.005; // Rotation per pixel
export const FRICTION = 0.95; // Momentum decay (0-1)
export const MIN_VELOCITY = 0.001; // Stop threshold

// Snap animation
export const SNAP_DURATION = 300; // milliseconds
export const SNAP_EASING = 'cubic-bezier(0.4, 0.0, 0.2, 1)'; // Material Design easing

// Interaction thresholds
export const CLICK_THRESHOLD = 5; // pixels - below this = click, above = drag
export const DRAG_START_THRESHOLD = 10; // pixels before drag starts

// Active segment angle (3 o'clock position = 90 degrees from top)
export const ACTIVE_ANGLE = 90;

/**
 * Unified PHYSICS object for convenience imports
 */
export const PHYSICS = {
	DRAG_SENSITIVITY,
	FRICTION,
	MIN_VELOCITY,
	SNAP_DURATION,
	SNAP_EASING,
	CLICK_THRESHOLD,
	DRAG_START_THRESHOLD,
	ACTIVE_ANGLE
} as const
