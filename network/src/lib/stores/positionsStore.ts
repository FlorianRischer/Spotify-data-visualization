import { writable } from 'svelte/store';

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
  let result: NodeSnapshot[] | null = null;
  snapshots.subscribe(current => {
    result = current[category] || null;
  })();
  return result;
}

/**
 * Prüft, ob ein Snapshot für eine Kategorie existiert
 */
export function hasSnapshot(category: string): boolean {
  let result = false;
  snapshots.subscribe(current => {
    result = !!current[category];
  })();
  return result;
}

/**
 * Löscht alle Snapshots (z.B. bei Neustart)
 */
export function clearAllSnapshots() {
  snapshots.set({});
}

/**
 * Löscht Snapshot für spezifische Kategorie
 */
export function clearSnapshot(category: string) {
  snapshots.update(current => {
    const updated = { ...current };
    delete updated[category];
    return updated;
  });
}

export const positionsStore = snapshots;
