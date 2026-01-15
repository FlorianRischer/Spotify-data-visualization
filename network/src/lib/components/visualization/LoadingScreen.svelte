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
    background: #0d1117;
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
    border: 3px solid rgba(139, 148, 158, 0.2);
    border-top-color: #8b949e;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  .loading-text {
    font-family: 'Inter', sans-serif;
    font-size: 14px;
    color: #8b949e;
    text-align: center;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
</style>
