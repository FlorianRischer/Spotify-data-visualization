<script lang="ts">
  import { scrollyStore } from '$lib/stores/scrollyStore';
  import { graphData } from '$lib/stores';

  const categoryDescriptions: Record<string, { title: string; description: string }> = {
    'Electronic & Dance': {
      title: 'Electronic & Dance',
      description: 'Elektronische Musik mit Fokus auf rhythmische Tanzmusik, Synths und Beats'
    },
    'Hip-Hop & Rap': {
      title: 'Hip-Hop & Rap',
      description: 'Lyrische Musik mit Fokus auf Rhythmus, Wortspiele und kulturelle Ausdrücke'
    },
    'Rock & Alternative': {
      title: 'Rock & Alternative',
      description: 'Gitarrenbasierte Musik mit vielfältigen Subgenres und experimentellen Klängen'
    },
    'Pop': {
      title: 'Pop',
      description: 'Zugängliche, kommerzielle Musik mit hoher Melodie und Singbarkeit'
    },
    'Soul & R&B': {
      title: 'Soul & R&B',
      description: 'Gefühlvolle Musik mit Fokus auf Gesang, Harmonie und Emotionalität'
    },
    'Latin & Reggae': {
      title: 'Latin & Reggae',
      description: 'Musik aus lateinamerikanischen und karibischen Traditionen'
    },
    'Metal': {
      title: 'Metal',
      description: 'Schwere, aggressive Musik mit komplexen Gitarren und intensiven Vocals'
    },
    'Specialty & Other': {
      title: 'Specialty & Other',
      description: 'Verschiedene Nischen-Genres und experimentelle Musikstile'
    }
  };

  $: focusedCategory = $scrollyStore.focusedCategory || 'Intro';
  $: content = categoryDescriptions[focusedCategory] || {
    title: focusedCategory,
    description: 'Erkunde die Musikgenres und ihre Verbindungen'
  };

  $: nodeCount = $graphData?.nodes.length ?? 0;
  $: edgeCount = $graphData?.edges.length ?? 0;
</script>

<aside class="side-panel">
  <div class="panel-content">
    <h2 class="panel-title">{content.title}</h2>
    <p class="panel-description">{content.description}</p>
    
    <div class="stats-section">
      <div class="stat-item">
        <span class="stat-label">Gesamt Genres:</span>
        <span class="stat-value">{nodeCount}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Verbindungen:</span>
        <span class="stat-value">{edgeCount}</span>
      </div>
    </div>

    <div class="scroll-hint">
      <p>Scrolle um verschiedene Genres zu erkunden</p>
    </div>
  </div>
</aside>

<style>
  .side-panel {
    width: 280px;
    padding: 24px 16px;
    background: rgba(255, 255, 255, 0.03);
    border-right: 1px solid rgba(255, 255, 255, 0.1);
    display: flex;
    flex-direction: column;
    overflow-y: auto;
    flex-shrink: 0;
  }

  .panel-content {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .panel-title {
    font-size: 18px;
    font-weight: 600;
    color: #e6edf3;
    margin: 0;
    line-height: 1.4;
  }

  .panel-description {
    font-size: 13px;
    color: #8b949e;
    line-height: 1.6;
    margin: 0;
  }

  .stats-section {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 12px 0;
    border-top: 1px solid rgba(255, 255, 255, 0.05);
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  }

  .stat-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 13px;
  }

  .stat-label {
    color: #8b949e;
  }

  .stat-value {
    color: #58a6ff;
    font-weight: 600;
  }

  .scroll-hint {
    font-size: 12px;
    color: #6e7681;
    font-style: italic;
    padding: 12px 0 0;
  }

  .scroll-hint p {
    margin: 0;
    line-height: 1.4;
  }

  @media (max-width: 768px) {
    .side-panel {
      width: 100%;
      border-right: none;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      padding: 16px;
    }
  }
</style>
