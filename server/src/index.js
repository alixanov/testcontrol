const path = require('path');
const express = require('express');
const app = require('./app');

const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0';

// Static frontend serving if built
const clientDist = path.resolve(__dirname, '../../client/dist');
app.use(express.static(clientDist, {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    }
  }
}));

// SPA fallback for non-API routes
app.get('*', (req, res, next) => {
  if (req.originalUrl.startsWith('/api')) {
    return next();
  }
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.sendFile(path.join(clientDist, 'index.html'), (err) => {
    if (err) {
      res.status(200).send(`
        <!DOCTYPE html>
        <html>
        <head><title>Online Testing Server</title></head>
        <body style="font-family: sans-serif; padding: 40px; text-align: center;">
          <h2>Платформа онлайн-тестирования — API сервер активен</h2>
          <p>Сервер запущен на порту ${PORT}. Фронтенд запускается через Vite на порту 5173 или выполните <code>npm run build</code> в папке client.</p>
        </body>
        </html>
      `);
    }
  });
});

const { startKeepAlive } = require('./keepAlive');

app.listen(PORT, HOST, () => {
  console.log(`===============================================`);
  console.log(`🚀 Сервер онлайн-тестирования запущен!`);
  console.log(`🌐 API доступен по адресу: http://${HOST}:${PORT}`);
  console.log(`🔑 Логин администратора по умолчанию: admin / admin123`);
  console.log(`===============================================`);
  startKeepAlive();
});
