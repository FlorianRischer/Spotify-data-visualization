<!--
  PieSegments.svelte
  
  Renders pie chart segments as 3D overlays on the vinyl.
  Uses RingGeometry for each segment.
-->
<script lang="ts">
	import { T } from '@threlte/core';
	import type { GenreData } from '$lib/types';
	import type { SegmentBounds } from '$lib/utils/mathUtils';
	import { getGenreColor } from '$lib/utils/colorUtils';
	import { DEG2RAD } from 'three/src/math/MathUtils.js';

	/** Genre data */
	export let genres: GenreData[] = [];

	/** Pre-calculated segment bounds */
	export let segmentBounds: SegmentBounds[] = [];

	/** Currently active segment ID */
	export let activeId: string | undefined = undefined;

	/** Inner radius of the pie (relative to vinyl) */
	export let innerRadius: number = 0.45;

	/** Outer radius of the pie (relative to vinyl) */
	export let outerRadius: number = 1.9;

	/** Height offset above vinyl surface */
	export let yOffset: number = 0.03;

	/** Segment resolution (more = smoother curves) */
	export let segments: number = 32;

	// Calculate segment properties
	function getSegmentProps(genre: GenreData, bounds: SegmentBounds) {
		const startAngle = (bounds.startAngle - 90) * DEG2RAD; // Offset to start at 12 o'clock
		const endAngle = (bounds.endAngle - 90) * DEG2RAD;
		const thetaLength = endAngle - startAngle;

		return {
			startAngle,
			thetaLength,
			color: genre.color || getGenreColor(genre.name),
			isActive: genre.id === activeId
		};
	}
</script>

<T.Group rotation.x={-Math.PI / 2} position.y={yOffset}>
	{#each genres as genre, i}
		{@const bounds = segmentBounds[i]}
		{@const props = getSegmentProps(genre, bounds)}
		
		{#if bounds && props.thetaLength > 0}
			<T.Mesh>
				<T.RingGeometry
					args={[
						innerRadius,
						outerRadius,
						segments,
						1,
						props.startAngle,
						props.thetaLength
					]}
				/>
				<T.MeshStandardMaterial
					color={props.color}
					transparent
					opacity={props.isActive ? 0.9 : 0.7}
					metalness={0.1}
					roughness={0.8}
					emissive={props.color}
					emissiveIntensity={props.isActive ? 0.3 : 0}
				/>
			</T.Mesh>

			<!-- Active segment highlight ring -->
			{#if props.isActive}
				<T.Mesh position.z={0.01}>
					<T.RingGeometry
						args={[
							outerRadius - 0.02,
							outerRadius,
							segments,
							1,
							props.startAngle,
							props.thetaLength
						]}
					/>
					<T.MeshBasicMaterial
						color="#ffffff"
						transparent
						opacity={0.8}
					/>
				</T.Mesh>
			{/if}
		{/if}
	{/each}
</T.Group>
