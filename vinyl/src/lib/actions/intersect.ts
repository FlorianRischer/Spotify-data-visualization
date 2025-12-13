/**
 * Svelte Action: use:intersect
 * 
 * Uses Intersection Observer to detect when element enters/leaves viewport
 */

export interface IntersectOptions {
	/** Called when element enters viewport */
	onEnter?: (entry: IntersectionObserverEntry) => void;
	/** Called when element leaves viewport */
	onLeave?: (entry: IntersectionObserverEntry) => void;
	/** Called on every intersection change */
	onChange?: (entry: IntersectionObserverEntry) => void;
	/** Threshold(s) at which to trigger callback (0-1) */
	threshold?: number | number[];
	/** Root element for intersection (null = viewport) */
	root?: Element | null;
	/** Margin around root */
	rootMargin?: string;
	/** Only trigger once then disconnect */
	once?: boolean;
}

export interface IntersectActionReturn {
	update: (options: IntersectOptions) => void;
	destroy: () => void;
}

export function intersect(node: HTMLElement, options: IntersectOptions = {}): IntersectActionReturn {
	let observer: IntersectionObserver | null = null;
	let hasTriggered = false;

	function createObserver(opts: IntersectOptions) {
		// Disconnect existing observer
		if (observer) {
			observer.disconnect();
		}

		observer = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					// Handle once option
					if (opts.once && hasTriggered) return;

					// Always call onChange if provided
					opts.onChange?.(entry);

					if (entry.isIntersecting) {
						opts.onEnter?.(entry);
						if (opts.once) {
							hasTriggered = true;
							observer?.disconnect();
						}
					} else {
						opts.onLeave?.(entry);
					}
				});
			},
			{
				threshold: opts.threshold ?? 0.5,
				root: opts.root ?? null,
				rootMargin: opts.rootMargin ?? '0px'
			}
		);

		observer.observe(node);
	}

	createObserver(options);

	return {
		update(newOptions: IntersectOptions) {
			createObserver(newOptions);
		},
		destroy() {
			observer?.disconnect();
		}
	};
}

/**
 * Helper: Create multiple threshold values
 * Useful for tracking scroll progress within an element
 */
export function createThresholds(steps: number = 10): number[] {
	return Array.from({ length: steps + 1 }, (_, i) => i / steps);
}
