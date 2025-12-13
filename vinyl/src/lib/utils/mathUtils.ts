/**
 * Math Utilities for Polar Coordinates and Angles
 */

/**
 * Convert degrees to radians
 */
export function degToRad(degrees: number): number {
	return (degrees * Math.PI) / 180;
}

/**
 * Convert radians to degrees
 */
export function radToDeg(radians: number): number {
	return (radians * 180) / Math.PI;
}

/**
 * Normalize angle to 0-360 range
 */
export function normalizeAngle(angle: number): number {
	angle = angle % 360;
	return angle < 0 ? angle + 360 : angle;
}

/**
 * Calculate angle from center point
 */
export function calculateAngle(centerX: number, centerY: number, x: number, y: number): number {
	const dx = x - centerX;
	const dy = y - centerY;
	let angle = Math.atan2(dy, dx);
	angle = radToDeg(angle);
	// Convert to 0° = top (12 o'clock)
	angle = normalizeAngle(angle + 90);
	return angle;
}

/**
 * Linear interpolation
 */
export function lerp(start: number, end: number, t: number): number {
	return start + (end - start) * t;
}

/**
 * Clamp value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
	return Math.min(Math.max(value, min), max);
}

// ============================================
// Segment & Pie Chart Utilities
// ============================================

import type { GenreData } from '$lib/types';
import { PHYSICS } from '$lib/constants/physics';

/**
 * Bounds for a pie segment
 */
export interface SegmentBounds {
	id: string;
	startAngle: number; // Degrees, 0 = 12 o'clock
	endAngle: number;
	percentage: number;
}

/**
 * Calculate segment bounds from genre data
 * Distributes genres around the pie based on percentage
 */
export function calculateSegmentBounds(genres: GenreData[]): SegmentBounds[] {
	if (genres.length === 0) return [];

	let currentAngle = 0;

	return genres.map((genre) => {
		const segmentAngle = (genre.percentage / 100) * 360;
		const bounds: SegmentBounds = {
			id: genre.id,
			startAngle: currentAngle,
			endAngle: currentAngle + segmentAngle,
			percentage: genre.percentage
		};
		currentAngle += segmentAngle;
		return bounds;
	});
}

/**
 * Find which segment contains a given angle
 */
export function findSegmentAtAngle(
	angle: number,
	segments: SegmentBounds[]
): SegmentBounds | null {
	const normalized = normalizeAngle(angle);

	return (
		segments.find(
			(seg) => normalized >= seg.startAngle && normalized < seg.endAngle
		) ?? null
	);
}

/**
 * Get the active segment based on current rotation
 * Active position is at 3 o'clock (90°)
 */
export function getActiveSegment(
	rotation: number,
	segments: SegmentBounds[]
): SegmentBounds | null {
	if (segments.length === 0) return null;

	// What angle is at the active position (3 o'clock = 90°)?
	// If vinyl is rotated by X°, then the segment at angle (90° - X°) is now at the active position
	const effectiveAngle = normalizeAngle(PHYSICS.ACTIVE_ANGLE - rotation);

	return findSegmentAtAngle(effectiveAngle, segments);
}

/**
 * Calculate the center angle of a segment
 */
export function getSegmentCenterAngle(segment: SegmentBounds): number {
	return (segment.startAngle + segment.endAngle) / 2;
}

/**
 * Calculate the rotation needed to center a specific segment at the active position
 */
export function getRotationForSegment(segment: SegmentBounds): number {
	const centerAngle = getSegmentCenterAngle(segment);
	// To put centerAngle at ACTIVE_ANGLE (90°), rotate by: ACTIVE_ANGLE - centerAngle
	return PHYSICS.ACTIVE_ANGLE - centerAngle;
}

/**
 * Calculate snap target rotation
 * Finds nearest segment center and returns rotation to snap to it
 */
export function calculateSnapTarget(
	currentRotation: number,
	segments: SegmentBounds[]
): number {
	if (segments.length === 0) return currentRotation;

	// Find which segment is currently at active position
	const activeSegment = getActiveSegment(currentRotation, segments);
	if (!activeSegment) return currentRotation;

	// Calculate rotation needed to perfectly center this segment
	const targetRotation = getRotationForSegment(activeSegment);

	// Handle wrap-around: find the closest equivalent rotation
	const delta = targetRotation - currentRotation;
	const normalizedDelta = ((delta + 180) % 360) - 180;

	return currentRotation + normalizedDelta;
}

/**
 * Get distance between two angles (shortest path)
 */
export function angleDifference(a: number, b: number): number {
	const diff = normalizeAngle(a - b);
	return diff > 180 ? diff - 360 : diff;
}

/**
 * Map a value from one range to another
 */
export function mapRange(
	value: number,
	inMin: number,
	inMax: number,
	outMin: number,
	outMax: number
): number {
	return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
}
