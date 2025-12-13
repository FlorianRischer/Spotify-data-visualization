<!--
  VinylInteraction.svelte
  
  Handles drag interaction for rotating the vinyl.
  Implements momentum and snap-to-segment behavior.
-->
<script lang="ts">
	import { T, useThrelte } from '@threlte/core';
	import { createEventDispatcher, onMount, onDestroy } from 'svelte';
	import { PHYSICS } from '$lib/constants/physics';
	import type { SegmentBounds } from '$lib/utils/mathUtils';
	import { calculateSnapTarget } from '$lib/utils/mathUtils';

	/** Current rotation in degrees */
	export let rotation: number = 0;

	/** Segment bounds for snapping */
	export let segmentBounds: SegmentBounds[] = [];

	const dispatch = createEventDispatcher<{
		rotationChange: number;
		snapComplete: string;
	}>();

	const { renderer } = useThrelte();

	let isDragging = false;
	let startX = 0;
	let velocity = 0;
	let lastX = 0;
	let lastTime = 0;
	let rafId: number | null = null;
	let currentRotation = rotation;

	// Sync external rotation changes
	$: if (!isDragging) currentRotation = rotation;

	function handlePointerDown(e: PointerEvent) {
		if (e.button !== 0) return;

		isDragging = true;
		startX = e.clientX;
		lastX = e.clientX;
		lastTime = performance.now();
		velocity = 0;

		// Stop any ongoing momentum
		if (rafId) {
			cancelAnimationFrame(rafId);
			rafId = null;
		}

		// Add global listeners for reliable tracking
		window.addEventListener('pointermove', handlePointerMove);
		window.addEventListener('pointerup', handlePointerUp);
	}

	function handlePointerMove(e: PointerEvent) {
		if (!isDragging) return;

		const now = performance.now();
		const deltaX = e.clientX - lastX;
		const dt = now - lastTime;

		// Calculate velocity
		if (dt > 0) {
			velocity = (deltaX * PHYSICS.DRAG_SENSITIVITY) / dt * 16;
		}

		// Update rotation
		currentRotation += deltaX * PHYSICS.DRAG_SENSITIVITY;
		dispatch('rotationChange', currentRotation);

		lastX = e.clientX;
		lastTime = now;
	}

	function handlePointerUp() {
		if (!isDragging) return;

		isDragging = false;

		// Remove global listeners
		window.removeEventListener('pointermove', handlePointerMove);
		window.removeEventListener('pointerup', handlePointerUp);

		// Start momentum animation
		startMomentum();
	}

	function startMomentum() {
		function tick() {
			// Apply friction
			velocity *= PHYSICS.FRICTION;

			// Update rotation
			currentRotation += velocity;
			dispatch('rotationChange', currentRotation);

			// Continue until velocity is low enough
			if (Math.abs(velocity) > PHYSICS.MIN_VELOCITY) {
				rafId = requestAnimationFrame(tick);
			} else {
				// Snap to nearest segment
				snapToNearest();
			}
		}

		tick();
	}

	function snapToNearest() {
		if (segmentBounds.length === 0) return;

		const targetRotation = calculateSnapTarget(currentRotation, segmentBounds);
		animateSnapTo(targetRotation);
	}

	function animateSnapTo(targetRotation: number) {
		const startRotation = currentRotation;
		const delta = targetRotation - startRotation;
		const startTime = performance.now();
		const duration = PHYSICS.SNAP_DURATION;

		function tick(now: number) {
			const elapsed = now - startTime;
			const progress = Math.min(elapsed / duration, 1);

			// Ease-out-back for natural feeling
			const eased = easeOutBack(progress);

			currentRotation = startRotation + delta * eased;
			dispatch('rotationChange', currentRotation);

			if (progress < 1) {
				rafId = requestAnimationFrame(tick);
			} else {
				rafId = null;
			}
		}

		rafId = requestAnimationFrame(tick);
	}

	function easeOutBack(x: number): number {
		const c1 = 1.70158;
		const c3 = c1 + 1;
		return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
	}

	onMount(() => {
		const canvas = renderer.domElement;
		canvas.addEventListener('pointerdown', handlePointerDown);
		canvas.style.touchAction = 'none';

		return () => {
			canvas.removeEventListener('pointerdown', handlePointerDown);
		};
	});

	onDestroy(() => {
		if (rafId) cancelAnimationFrame(rafId);
		window.removeEventListener('pointermove', handlePointerMove);
		window.removeEventListener('pointerup', handlePointerUp);
	});
</script>

<!-- This component doesn't render anything visible -->
<!-- It attaches event handlers to the canvas -->
