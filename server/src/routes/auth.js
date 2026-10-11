const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { authenticateAdmin, JWT_SECRET } = require('../middleware/auth');

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Пожалуйста, введите имя пользователя и пароль' });
  }

  const admin = db.prepare('SELECT * FROM admins WHERE username = ?').get(username);
  if (!admin) {
    return res.status(401).json({ error: 'Неверное имя пользователя или пароль' });
  }

  const isMatch = bcrypt.compareSync(password, admin.password_hash);
  if (!isMatch) {
    return res.status(401).json({ error: 'Неверное имя пользователя или пароль' });
  }

  const token = jwt.sign(
    { id: admin.id, username: admin.username },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.json({
    token,
    admin: {
      id: admin.id,
      username: admin.username,
    },
  });
});

// GET /api/auth/me
router.get('/me', authenticateAdmin, (req, res) => {
  const admin = db.prepare('SELECT id, username, created_at FROM admins WHERE id = ?').get(req.admin.id);
  if (!admin) {
    return res.status(404).json({ error: 'Администратор не найден' });
  }
  res.json({ admin });
});

// POST /api/auth/change-password
router.post('/change-password', authenticateAdmin, (req, res) => {
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword) {
    return res.status(400).json({ error: 'Заполните старый и новый пароль' });
  }
  if (newPassword.length < 5) {
    return res.status(400).json({ error: 'Новый пароль должен содержать минимум 5 символов' });
  }

  const admin = db.prepare('SELECT * FROM admins WHERE id = ?').get(req.admin.id);
  if (!admin || !bcrypt.compareSync(oldPassword, admin.password_hash)) {
    return res.status(400).json({ error: 'Старый пароль неверен' });
  }

  const salt = bcrypt.genSaltSync(10);
  const newHash = bcrypt.hashSync(newPassword, salt);
  db.prepare('UPDATE admins SET password_hash = ? WHERE id = ?').run(newHash, req.admin.id);

  res.json({ message: 'Пароль успешно обновлен' });
});

module.exports = router;
