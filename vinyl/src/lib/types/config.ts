import type { GenreData } from './genre';

/**
 * Detail Panel Configuration
 */
export interface DetailPanelConfig {
  sections: DetailPanelSection[];
}

export interface DetailPanelSection {
  id: string;
  label: string;
  type: 'stat' | 'list' | 'chart';
  dataKey: keyof GenreData;
  visible: boolean;
  order: number;
}

/**
 * Detail Section Configuration (for DetailSection.svelte)
 */
export interface DetailSectionConfig {
  id?: string;
  type: 'header' | 'stat' | 'stat-grid' | 'list' | 'progress' | 'chart';
  label?: string;
  dataKey?: keyof GenreData | string;
  visible?: boolean;
  order?: number;
  options?: {
    format?: 'number' | 'hours' | 'percent';
    icon?: string;
    maxItems?: number;
  };
}

/**
 * Cache Configuration
 */
export interface CacheConfig {
  enabled: boolean;
  maxAge: number; // in milliseconds
  paths: {
    artistGenres: string;
    artistDetails: string;
    trackFeatures: string;
  };
}
