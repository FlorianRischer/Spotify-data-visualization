<script lang="ts">
  export let status: string;
</script>

<div class="loading-screen">
  <div class="loading-content">
    <div class="spinner"></div>
    <p class="loading-text">{status}</p>
  </div>
</div>

<style>
  .loading-screen {
    position: fixed;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #FAF1EC;
    z-index: 9999;
  }

  .loading-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 24px;
  }

  .spinner {
    width: 48px;
    height: 48px;
    border: 3px solid rgba(26, 26, 26, 0.08);
    border-top-color: #1a1a1a;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  .loading-text {
    font-family: 'Inter', sans-serif;
    font-size: 14px;
    color: #666;
    text-align: center;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  @media (max-width: 1200px) {
    .spinner {
      width: 44px;
      height: 44px;
    }
  }

  @media (max-width: 900px) {
    .loading-content {
      gap: 20px;
    }

    .spinner {
      width: 40px;
      height: 40px;
    }

    .loading-text {
      font-size: 13px;
    }
  }

  @media (max-width: 600px) {
    .loading-content {
      gap: 16px;
    }

    .spinner {
      width: 36px;
      height: 36px;
      border-width: 2px;
    }

    .loading-text {
      font-size: 12px;
    }
  }
</style>
