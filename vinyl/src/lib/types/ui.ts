/**
 * UI State Types
 */
export interface UIState {
  vinylRotation: number; // In radians
  activeGenreId: string | null;
  isDragging: boolean;
  isSnapping: boolean;
}

export interface ScrollState {
  currentSection: number;
  progress: number; // 0-1
  scrollProgress: number; // Alias for progress (0-1)
  direction: 'up' | 'down' | null;
}

/**
 * Drag State
 */
export interface DragState {
  isDragging: boolean;
  startX: number;
  startY: number;
  lastX: number;
  lastY: number;
  velocity: number;
}

/**
 * Loading States
 */
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface DataState<T> {
  data: T | null;
  status: LoadingState;
  error: Error | null;
}
