// UI Store — hover, expansion queue, reduced motion, keyboard focus
import { writable, derived, get } from "svelte/store";
import { browser } from "$app/environment";

// ============ Hover State ============
export const hoverNodeId = writable<string | null>(null);
export const hoverPosition = writable<{ x: number; y: number } | null>(null);

// ============ Expansion Queue ============
interface ExpansionQueueItem {
  nodeId: string;
  addedAt: number;
}
export const expansionQueue = writable<ExpansionQueueItem[]>([]);

// ============ Reduced Motion ============
function getSystemReducedMotion(): boolean {
  if (!browser) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export const reducedMotionOverride = writable<boolean | null>(null);
export const reducedMotion = derived(reducedMotionOverride, ($override) => {
  if ($override !== null) return $override;
  return false; // Always enable motion
});

export function toggleReducedMotion() {
  reducedMotionOverride.update((v) => {
    if (v === null) return !getSystemReducedMotion();
    return !v;
  });
}

// ============ Keyboard Focus ============
export const focusedNodeId = writable<string | null>(null);
export const keyboardMode = writable<boolean>(false);

// ============ Tooltip ============
export interface TooltipData {
  nodeId: string;
  label: string;
  playCount: number;
  totalMinutes: number;
  degree: number;
  percentage: number;
  x: number;
  y: number;
  topArtist?: string;
  topArtistMinutes?: number;
}
export const tooltipData = writable<TooltipData | null>(null);

// ============ Animation State ============
interface AnimatingNode {
  nodeId: string;
  startTime: number;
  duration: number;
}
export const animatingNodes = writable<Map<string, AnimatingNode>>(new Map());

export function startNodeAnimation(nodeId: string, duration = 300) {
  const rm = get(reducedMotion);
  if (rm) return; // skip animations if reduced motion
  
  animatingNodes.update((map) => {
    const newMap = new Map(map);
    newMap.set(nodeId, { nodeId, startTime: performance.now(), duration });
    return newMap;
  });
}

export function clearExpiredAnimations() {
  const now = performance.now();
  animatingNodes.update((map) => {
    const newMap = new Map();
    for (const [id, anim] of map) {
      if (now - anim.startTime < anim.duration) {
        newMap.set(id, anim);
      }
    }
    return newMap;
  });
}

// ============ Config Constants ============
export const CONFIG = {
  hoverDelay: 150, // ms before expansion starts
  hideDelay: 200, // ms grace period before hiding
  batchSize: 8, // max neighbors to add per batch
  maxDepth: 4, // optional depth cap
  animationDuration: 300 // ms for fade/scale in
} as const;
