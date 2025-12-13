/**
 * Number and Time Formatters
 */

/**
 * Format number with thousands separator
 */
export function formatNumber(num: number): string {
	return new Intl.NumberFormat('de-DE').format(num);
}

/**
 * Format hours to readable string
 */
export function formatHours(hours: number): string {
	if (hours < 1) {
		return `${Math.round(hours * 60)} min`;
	}
	return `${Math.round(hours)} h`;
}

/**
 * Format minutes to hours and minutes
 */
export function formatMinutes(minutes: number): string {
	const hours = Math.floor(minutes / 60);
	const mins = Math.round(minutes % 60);

	if (hours === 0) {
		return `${mins} min`;
	}

	return mins > 0 ? `${hours} h ${mins} min` : `${hours} h`;
}

/**
 * Format percentage
 */
export function formatPercentage(value: number, decimals: number = 1): string {
	return `${value.toFixed(decimals)}%`;
}

/**
 * Alias for formatPercentage
 */
export function formatPercent(value: number, decimals: number = 1): string {
	return formatPercentage(value, decimals);
}

/**
 * Format date to readable string
 */
export function formatDate(date: Date | string): string {
	const d = typeof date === 'string' ? new Date(date) : date;
	return new Intl.DateTimeFormat('de-DE', {
		year: 'numeric',
		month: 'long',
		day: 'numeric'
	}).format(d);
}
