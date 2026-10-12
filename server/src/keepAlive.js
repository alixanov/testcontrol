const https = require('https');
const http = require('http');

function startKeepAlive() {
  const isProd = process.env.NODE_ENV === 'production' || !!process.env.RENDER || !!process.env.RENDER_EXTERNAL_URL;
  const rawUrl = process.env.RENDER_EXTERNAL_URL || process.env.APP_URL || process.env.PING_URL || (isProd ? 'https://testcontrol-fyzs.onrender.com' : null);
  
  if (!rawUrl) {
    return;
  }

  const pingUrl = rawUrl.endsWith('/') ? `${rawUrl}api/health` : `${rawUrl}/api/health`;
  // Ping every 12 minutes so Render never goes into sleep mode
  const intervalMs = 12 * 60 * 1000;

  console.log(`[KeepAlive] Service scheduled to self-ping ${pingUrl} every 12 minutes.`);

  setInterval(() => {
    try {
      const client = pingUrl.startsWith('https') ? https : http;
      client.get(pingUrl, (res) => {
        console.log(`[KeepAlive] Self-ping status: ${res.statusCode} at ${new Date().toLocaleTimeString()}`);
      }).on('error', (err) => {
        console.warn(`[KeepAlive] Ping warning: ${err.message}`);
      });
    } catch (e) {
      console.warn(`[KeepAlive] Ping exception: ${e.message}`);
    }
  }, intervalMs);
}

module.exports = { startKeepAlive };
