import { get } from 'svelte/store';
import { scrollyStore, setCameraPosition } from '$lib/stores/scrollyStore';

export interface CameraTarget {
  zoom: number;
  x: number;
  y: number;
}

// Easing functions
function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function easeInOutCubic(t: number): number {
  return t < 0.5 
    ? 4 * t * t * t 
    : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function easeInOutQuad(t: number): number {
  return t < 0.5 
    ? 2 * t * t 
    : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

export class CameraController {
  private animationId: number | null = null;
  private startTime: number = 0;
  private duration: number = 1500;
  private startPosition: CameraTarget = { zoom: 1, x: 0, y: 0 };
  private targetPosition: CameraTarget = { zoom: 1, x: 0, y: 0 };
  private isAnimating: boolean = false;
  private onComplete: (() => void) | null = null;

  /**
   * Animiert die Kamera zu einem Ziel
   */
  animateToTarget(
    target: CameraTarget, 
    duration: number = 1500,
    onComplete?: () => void
  ) {
    // Aktuelle Position als Start speichern
    const state = get(scrollyStore);
    this.startPosition = {
      zoom: state.cameraZoom,
      x: state.cameraX,
      y: state.cameraY
    };
    this.targetPosition = target;
    this.duration = duration;
    this.onComplete = onComplete || null;

    // Bestehende Animation abbrechen
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
    }

    this.isAnimating = true;
    this.startTime = performance.now();
    setCameraPosition(this.startPosition.zoom, this.startPosition.x, this.startPosition.y, true);
    
    this.animate();
  }

  private animate = () => {
    const elapsed = performance.now() - this.startTime;
    const progress = Math.min(elapsed / this.duration, 1);
    const eased = easeInOutCubic(progress);

    // Interpoliere Position
    const currentZoom = this.startPosition.zoom + (this.targetPosition.zoom - this.startPosition.zoom) * eased;
    const currentX = this.startPosition.x + (this.targetPosition.x - this.startPosition.x) * eased;
    const currentY = this.startPosition.y + (this.targetPosition.y - this.startPosition.y) * eased;

    setCameraPosition(currentZoom, currentX, currentY, progress < 1);

    if (progress < 1) {
      this.animationId = requestAnimationFrame(this.animate);
    } else {
      this.isAnimating = false;
      this.animationId = null;
      if (this.onComplete) {
        this.onComplete();
      }
    }
  };

  /**
   * Zoomt zu einer Kategorie-Position
   */
  animateToCategoryPosition(x: number, y: number, duration: number = 1500) {
    this.animateToTarget({ zoom: 1.5, x: -x * 0.5, y: -y * 0.5 }, duration);
  }

  /**
   * Kehrt zur Übersicht zurück
   */
  animateToOverview(duration: number = 1500) {
    this.animateToTarget({ zoom: 1, x: 0, y: 0 }, duration);
  }

  /**
   * Stoppt laufende Animation
   */
  stop() {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    this.isAnimating = false;
  }

  /**
   * Reset zur Standardansicht (ohne Animation)
   */
  reset() {
    this.stop();
    setCameraPosition(1, 0, 0, false);
  }

  /**
   * Prüft ob gerade eine Animation läuft
   */
  getIsAnimating(): boolean {
    return this.isAnimating;
  }

  /**
   * Gibt aktuelle Position zurück
   */
  getCurrentPosition(): CameraTarget {
    const state = get(scrollyStore);
    return {
      zoom: state.cameraZoom,
      x: state.cameraX,
      y: state.cameraY
    };
  }
}

// Singleton-Instanz
export const cameraController = new CameraController();
