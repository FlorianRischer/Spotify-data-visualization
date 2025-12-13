/**
 * Svelte Action: use:drag
 * 
 * Enables drag-to-rotate functionality on an element
 */

import { PHYSICS } from '$lib/constants/physics';

export interface DragOptions {
	/** Called when drag starts */
	onDragStart?: () => void;
	/** Called during drag with current rotation delta */
	onDrag?: (deltaX: number, deltaY: number) => void;
	/** Called when drag ends */
	onDragEnd?: (velocity: number) => void;
	/** Sensitivity multiplier for drag movement */
	sensitivity?: number;
	/** Whether to track velocity for momentum */
	trackVelocity?: boolean;
}

export interface DragActionReturn {
	update: (options: DragOptions) => void;
	destroy: () => void;
}

export function drag(node: HTMLElement, options: DragOptions = {}): DragActionReturn {
	let isDragging = false;
	let startX = 0;
	let startY = 0;
	let lastX = 0;
	let velocity = 0;
	let lastTime = 0;

	const sensitivity = options.sensitivity ?? PHYSICS.DRAG_SENSITIVITY;
	const trackVelocity = options.trackVelocity ?? true;

	function handlePointerDown(e: PointerEvent) {
		// Only handle primary button (left click / touch)
		if (e.button !== 0) return;

		isDragging = true;
		startX = e.clientX;
		startY = e.clientY;
		lastX = e.clientX;
		lastTime = performance.now();
		velocity = 0;

		// Capture pointer for reliable tracking
		node.setPointerCapture(e.pointerId);

		options.onDragStart?.();
	}

	function handlePointerMove(e: PointerEvent) {
		if (!isDragging) return;

		const deltaX = (e.clientX - lastX) * sensitivity;
		const deltaY = (e.clientY - startY) * sensitivity;

		// Track velocity for momentum
		if (trackVelocity) {
			const now = performance.now();
			const dt = now - lastTime;
			if (dt > 0) {
				velocity = deltaX / dt * 16; // Normalize to ~60fps
			}
			lastTime = now;
		}

		lastX = e.clientX;

		options.onDrag?.(deltaX, deltaY);
	}

	function handlePointerUp(e: PointerEvent) {
		if (!isDragging) return;

		isDragging = false;
		node.releasePointerCapture(e.pointerId);

		options.onDragEnd?.(velocity);
	}

	function handlePointerCancel(e: PointerEvent) {
		if (!isDragging) return;

		isDragging = false;
		node.releasePointerCapture(e.pointerId);

		options.onDragEnd?.(0);
	}

	// Prevent context menu on long press
	function handleContextMenu(e: Event) {
		if (isDragging) {
			e.preventDefault();
		}
	}

	// Add event listeners
	node.addEventListener('pointerdown', handlePointerDown);
	node.addEventListener('pointermove', handlePointerMove);
	node.addEventListener('pointerup', handlePointerUp);
	node.addEventListener('pointercancel', handlePointerCancel);
	node.addEventListener('contextmenu', handleContextMenu);

	// Touch-action to prevent browser gestures
	node.style.touchAction = 'none';
	node.style.userSelect = 'none';

	return {
		update(newOptions: DragOptions) {
			Object.assign(options, newOptions);
		},
		destroy() {
			node.removeEventListener('pointerdown', handlePointerDown);
			node.removeEventListener('pointermove', handlePointerMove);
			node.removeEventListener('pointerup', handlePointerUp);
			node.removeEventListener('pointercancel', handlePointerCancel);
			node.removeEventListener('contextmenu', handleContextMenu);
		}
	};
}
