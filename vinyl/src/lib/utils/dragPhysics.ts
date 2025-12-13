/**
 * Drag Physics for Vinyl Interaction
 * 
 * Handles drag momentum and snap-to-segment logic.
 * This will be implemented in future steps.
 */

import type { DragState } from '$lib/types';
import { FRICTION, MIN_VELOCITY } from '$lib/constants/physics';

/**
 * Calculate momentum velocity
 */
export function calculateVelocity(dragState: DragState, deltaTime: number): number {
	// TODO: Implement velocity calculation
	return 0;
}

/**
 * Apply friction to velocity
 */
export function applyFriction(velocity: number): number {
	return velocity * FRICTION;
}

/**
 * Check if velocity is below stop threshold
 */
export function shouldStop(velocity: number): boolean {
	return Math.abs(velocity) < MIN_VELOCITY;
}

/**
 * Calculate snap target angle
 */
export function calculateSnapTarget(
	currentAngle: number,
	segmentAngles: number[]
): number {
	// TODO: Implement snap calculation
	return currentAngle;
}
