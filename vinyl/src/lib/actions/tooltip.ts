/**
 * Svelte Action: use:tooltip
 * 
 * Shows a tooltip on hover/focus
 */

export interface TooltipOptions {
	/** Tooltip content (text or HTML) */
	content: string;
	/** Position relative to element */
	position?: 'top' | 'bottom' | 'left' | 'right';
	/** Delay before showing (ms) */
	delay?: number;
	/** Custom CSS class for tooltip */
	class?: string;
	/** Whether to allow HTML in content */
	html?: boolean;
	/** Offset from element (px) */
	offset?: number;
}

export interface TooltipActionReturn {
	update: (options: TooltipOptions) => void;
	destroy: () => void;
}

export function tooltip(node: HTMLElement, options: TooltipOptions): TooltipActionReturn {
	let tooltipEl: HTMLDivElement | null = null;
	let showTimeout: ReturnType<typeof setTimeout> | null = null;
	let isVisible = false;

	const position = options.position ?? 'top';
	const delay = options.delay ?? 200;
	const offset = options.offset ?? 8;

	function createTooltip() {
		tooltipEl = document.createElement('div');
		tooltipEl.className = `tooltip tooltip--${position} ${options.class ?? ''}`;

		if (options.html) {
			tooltipEl.innerHTML = options.content;
		} else {
			tooltipEl.textContent = options.content;
		}

		// Base styles
		Object.assign(tooltipEl.style, {
			position: 'fixed',
			zIndex: '9999',
			padding: '6px 12px',
			borderRadius: '4px',
			backgroundColor: 'rgba(0, 0, 0, 0.9)',
			color: 'white',
			fontSize: '13px',
			lineHeight: '1.4',
			pointerEvents: 'none',
			opacity: '0',
			transition: 'opacity 150ms ease',
			maxWidth: '250px',
			whiteSpace: 'pre-wrap'
		});

		document.body.appendChild(tooltipEl);
	}

	function positionTooltip() {
		if (!tooltipEl) return;

		const rect = node.getBoundingClientRect();
		const tooltipRect = tooltipEl.getBoundingClientRect();

		let top = 0;
		let left = 0;

		switch (position) {
			case 'top':
				top = rect.top - tooltipRect.height - offset;
				left = rect.left + (rect.width - tooltipRect.width) / 2;
				break;
			case 'bottom':
				top = rect.bottom + offset;
				left = rect.left + (rect.width - tooltipRect.width) / 2;
				break;
			case 'left':
				top = rect.top + (rect.height - tooltipRect.height) / 2;
				left = rect.left - tooltipRect.width - offset;
				break;
			case 'right':
				top = rect.top + (rect.height - tooltipRect.height) / 2;
				left = rect.right + offset;
				break;
		}

		// Keep within viewport
		const padding = 8;
		top = Math.max(padding, Math.min(top, window.innerHeight - tooltipRect.height - padding));
		left = Math.max(padding, Math.min(left, window.innerWidth - tooltipRect.width - padding));

		tooltipEl.style.top = `${top}px`;
		tooltipEl.style.left = `${left}px`;
	}

	function show() {
		if (isVisible) return;

		showTimeout = setTimeout(() => {
			if (!tooltipEl) createTooltip();
			positionTooltip();
			if (tooltipEl) {
				tooltipEl.style.opacity = '1';
			}
			isVisible = true;
		}, delay);
	}

	function hide() {
		if (showTimeout) {
			clearTimeout(showTimeout);
			showTimeout = null;
		}

		if (tooltipEl) {
			tooltipEl.style.opacity = '0';
			// Remove after transition
			setTimeout(() => {
				tooltipEl?.remove();
				tooltipEl = null;
			}, 150);
		}

		isVisible = false;
	}

	function handleMouseEnter() {
		show();
	}

	function handleMouseLeave() {
		hide();
	}

	function handleFocus() {
		show();
	}

	function handleBlur() {
		hide();
	}

	// Add event listeners
	node.addEventListener('mouseenter', handleMouseEnter);
	node.addEventListener('mouseleave', handleMouseLeave);
	node.addEventListener('focus', handleFocus);
	node.addEventListener('blur', handleBlur);

	return {
		update(newOptions: TooltipOptions) {
			Object.assign(options, newOptions);
			if (tooltipEl) {
				if (newOptions.html) {
					tooltipEl.innerHTML = newOptions.content;
				} else {
					tooltipEl.textContent = newOptions.content;
				}
				positionTooltip();
			}
		},
		destroy() {
			hide();
			node.removeEventListener('mouseenter', handleMouseEnter);
			node.removeEventListener('mouseleave', handleMouseLeave);
			node.removeEventListener('focus', handleFocus);
			node.removeEventListener('blur', handleBlur);
		}
	};
}
