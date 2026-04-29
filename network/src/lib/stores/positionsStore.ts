import { writable, get } from 'svelte/store';

export interface NodeSnapshot {
  id: string;
  x: number;
  y: number;
  size: number;
}

/**
 * Speichert Position-Snapshots für jede Kategorie
 * Beim Zurück-Scrollen werden diese Snapshots wiederhergestellt
 */
interface PositionSnapshots {
  [category: string]: NodeSnapshot[];
}

const snapshots = writable<PositionSnapshots>({});

/**
 * Speichert den aktuellen State aller Nodes für eine Kategorie
 */
export function savePositionSnapshot(category: string, nodes: NodeSnapshot[]) {
  snapshots.update(current => ({
    ...current,
    [category]: [...nodes] // Deep copy
  }));
}

/**
 * Holt gespeicherte Positionen für eine Kategorie
 */
export function getPositionSnapshot(category: string): NodeSnapshot[] | null {
  return get(snapshots)[category] || null;
}

export function hasSnapshot(category: string): boolean {
  return !!get(snapshots)[category];
}

export const positionsStore = snapshots;
