<!--
  VinylModel.svelte
  
  Loads and renders the vinyl 3D model.
  Falls back to a procedural cylinder if GLB not available.
-->
<script lang="ts">
	import { T } from '@threlte/core';
	import { useGltf, GLTF } from '@threlte/extras';
	import { MeshStandardMaterial, DoubleSide, Mesh } from 'three';
	import { onMount } from 'svelte';

	/** URL to the GLB model */
	export let url: string = '/models/vinyl.glb';

	/** Whether to use the fallback geometry if model fails */
	export let useFallback: boolean = false; // Deaktiviert weil GLB funktioniert

	/** Scale of the model */
	export let scale: number = 1;

	// Load GLB model
	const gltf = useGltf(url);

	// Process model once loaded
	$: if ($gltf) {
		console.log('✅ Model loaded, applying scale:', scale);
		$gltf.scene.scale.setScalar(scale);
		
		// Apply shadows
		$gltf.scene.traverse((child) => {
			if ((child as Mesh).isMesh) {
				child.castShadow = true;
				child.receiveShadow = true;
			}
		});
	}

	onMount(() => {
		console.log('🚀 VinylModel mounted');
	});
</script>

<!-- Verwende GLTF Komponente von threlte/extras direkt -->
<GLTF {url} {scale} />
