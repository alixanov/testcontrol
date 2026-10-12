// Manual / cron ping script to keep Render awake
const url = process.argv[2] || process.env.PING_URL || 'https://testcontrol-fyzs.onrender.com/api/health';

console.log(`[Ping] Pinging ${url}...`);

fetch(url)
  .then(async (res) => {
    console.log(`[Ping] Status: ${res.status}`);
    const data = await res.json().catch(() => null);
    console.log('[Ping] Body:', data);
  })
  .catch((err) => {
    console.error('[Ping] Error:', err.message);
  });
