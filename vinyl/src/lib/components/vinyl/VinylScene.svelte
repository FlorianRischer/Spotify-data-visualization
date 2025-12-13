<!--
  VinylScene.svelte
  
  3D Scene setup with camera, lighting, and vinyl model.
  Handles the Threlte scene graph.
-->
<script lang="ts">
	import { T, useTask } from '@threlte/core';
	import { OrbitControls, ContactShadows } from '@threlte/extras';
	import { createEventDispatcher } from 'svelte';
	import { DEG2RAD } from 'three/src/math/MathUtils.js';
	import VinylModel from './VinylModel.svelte';
	import PieSegments from './PieSegments.svelte';
	import VinylInteraction from './VinylInteraction.svelte';
	import type { GenreData } from '$lib/types';
	import { PHYSICS } from '$lib/constants/physics';
	import { calculateSegmentBounds, getActiveSegment } from '$lib/utils/mathUtils';

	/** Genre data for visualization */
	export let genres: GenreData[] = [];

	/** Current rotation in degrees */
	export let rotation: number = 0;

	/** Whether drag interaction is enabled */
	export let interactive: boolean = true;

	const dispatch = createEventDispatcher<{
		rotationChange: number;
		genreSelect: string;
	}>();

	// Calculate segment bounds for hit testing
	$: segmentBounds = calculateSegmentBounds(genres);

	// Track active segment based on rotation
	$: activeSegment = getActiveSegment(rotation, segmentBounds);
	$: {
		if (activeSegment) {
			dispatch('genreSelect', activeSegment.id);
		}
	}

	// Internal rotation in radians for Three.js
	$: rotationRad = rotation * DEG2RAD;

	function handleRotationChange(newRotation: number) {
		rotation = newRotation;
		dispatch('rotationChange', newRotation);
	}
</script>

<!-- Camera - von oben draufschauend -->
<T.PerspectiveCamera
	makeDefault
	position={[0, 4, 0.1]}
	fov={50}
	near={0.01}
	far={10000}
	on:create={({ ref }) => {
		ref.lookAt(0, 0, 0);
	}}
>
	<OrbitControls enableZoom={true} enablePan={true} />
</T.PerspectiveCamera>

<!-- Beleuchtung -->
<T.AmbientLight intensity={1.5} />
<T.DirectionalLight position={[5, 10, 5]} intensity={2} />
<T.DirectionalLight position={[-5, 5, -5]} intensity={1} />
<T.PointLight position={[0, 5, 0]} intensity={1} />

<!-- Vinyl group with rotation -->
<T.Group rotation.y={rotationRad}>
	<!-- 3D Vinyl Model - verschiedene Skalen zum Testen -->
	<VinylModel scale={0.005} />
</T.Group>

<!-- Contact shadows erstmal deaktiviert -->
<!--
<ContactShadows
	position.y={-0.5}
	opacity={0.4}
	scale={10}
	blur={2}
	far={4}
/>
-->

<!-- Interaction handler -->
{#if interactive}
	<VinylInteraction
		{rotation}
		{segmentBounds}
		on:rotationChange={(e) => handleRotationChange(e.detail)}
	/>
{/if}
