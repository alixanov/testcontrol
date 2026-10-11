const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

const dataDir = path.resolve(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'database.sqlite');
const db = new DatabaseSync(dbPath);

// Enable foreign keys
db.exec('PRAGMA foreign_keys = ON;');

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS tests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    access_code TEXT UNIQUE NOT NULL,
    time_limit_minutes INTEGER DEFAULT 0,
    passing_score INTEGER DEFAULT 60,
    shuffle_questions INTEGER DEFAULT 0,
    shuffle_options INTEGER DEFAULT 0,
    show_results INTEGER DEFAULT 1,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    test_id INTEGER NOT NULL,
    question_text TEXT NOT NULL,
    question_type TEXT NOT NULL, -- 'single', 'multiple', 'text'
    points REAL DEFAULT 1,
    order_num INTEGER DEFAULT 0,
    explanation TEXT,
    FOREIGN KEY(test_id) REFERENCES tests(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS options (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    question_id INTEGER NOT NULL,
    option_text TEXT NOT NULL,
    is_correct INTEGER DEFAULT 0,
    order_num INTEGER DEFAULT 0,
    FOREIGN KEY(question_id) REFERENCES questions(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS attempts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    test_id INTEGER NOT NULL,
    student_name TEXT NOT NULL,
    student_group TEXT NOT NULL,
    score REAL DEFAULT 0,
    max_score REAL DEFAULT 0,
    percentage REAL DEFAULT 0,
    passed INTEGER DEFAULT 0,
    started_at DATETIME,
    completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    duration_seconds INTEGER DEFAULT 0,
    FOREIGN KEY(test_id) REFERENCES tests(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS attempt_answers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    attempt_id INTEGER NOT NULL,
    question_id INTEGER NOT NULL,
    selected_option_ids TEXT, -- JSON array string [1, 3]
    text_answer TEXT,
    is_correct INTEGER DEFAULT 0,
    points_awarded REAL DEFAULT 0,
    FOREIGN KEY(attempt_id) REFERENCES attempts(id) ON DELETE CASCADE,
    FOREIGN KEY(question_id) REFERENCES questions(id) ON DELETE CASCADE
  );
`);

// Seed default admin if table is empty
const adminCount = db.prepare('SELECT COUNT(*) as count FROM admins').get();
if (adminCount.count === 0) {
  const salt = bcrypt.genSaltSync(10);
  const hash = bcrypt.hashSync('admin123', salt);
  const insertAdmin = db.prepare('INSERT INTO admins (username, password_hash) VALUES (?, ?)');
  insertAdmin.run('admin', hash);
  console.log('Default admin created: admin / admin123');
}

// Seed sample test if tests table is empty
const testCount = db.prepare('SELECT COUNT(*) as count FROM tests').get();
if (testCount.count === 0) {
  const insertTest = db.prepare(`
    INSERT INTO tests (title, description, access_code, time_limit_minutes, passing_score, shuffle_questions, shuffle_options, show_results, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const testRes = insertTest.run(
    'Основы компьютерной грамотности и кибербезопасности',
    'Входной тест для проверки базовых знаний по информатике, устройствам ПК и правилам безопасного поведения в сети интернет.',
    'demo-test',
    10, // 10 minutes
    70, // 70% passing score
    0,
    0,
    1,
    1
  );
  const testId = testRes.lastInsertRowid;

  const insertQuestion = db.prepare(`
    INSERT INTO questions (test_id, question_text, question_type, points, order_num, explanation)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const insertOption = db.prepare(`
    INSERT INTO options (question_id, option_text, is_correct, order_num)
    VALUES (?, ?, ?, ?)
  `);

  // Question 1: Single choice
  const q1 = insertQuestion.run(
    testId,
    'Какое устройство компьютера отвечает за выполнение арифметических и логических операций?',
    'single',
    1,
    1,
    'Центральный процессор (CPU) выполняет все вычисления и управление процессами в компьютере.'
  );
  insertOption.run(q1.lastInsertRowid, 'Центральный процессор (CPU)', 1, 1);
  insertOption.run(q1.lastInsertRowid, 'Оперативная память (RAM)', 0, 2);
  insertOption.run(q1.lastInsertRowid, 'Жесткий диск (HDD/SSD)', 0, 3);
  insertOption.run(q1.lastInsertRowid, 'Блок питания', 0, 4);

  // Question 2: Multiple choice
  const q2 = insertQuestion.run(
    testId,
    'Какие из перечисленных признаков указывают на фишинговое электронное письмо? (Выберите все подходящие варианты)',
    'multiple',
    2,
    2,
    'Фишинговые письма часто используют поддельные адреса отправителя, нагнетают срочность и содержат ссылки на сторонние сайты.'
  );
  insertOption.run(q2.lastInsertRowid, 'Странный адрес отправителя с ошибками в доменном имени', 1, 1);
  insertOption.run(q2.lastInsertRowid, 'Требование срочно ввести пароль или данные банковской карты', 1, 2);
  insertOption.run(q2.lastInsertRowid, 'Наличие официальной цифровой подписи организации без ссылок', 0, 3);
  insertOption.run(q2.lastInsertRowid, 'Подозрительные вложенные архивы или исполняемые файлы (.exe, .scr)', 1, 4);

  // Question 3: Text input
  const q3 = insertQuestion.run(
    testId,
    'Как называется протокол безопасной передачи данных в интернете, использующий шифрование (укажите аббревиатуру из 5 букв)?',
    'text',
    1,
    3,
    'HTTPS (HyperText Transfer Protocol Secure) обеспечивает защищенное зашифрованное соединение.'
  );
  insertOption.run(q3.lastInsertRowid, 'HTTPS', 1, 1);
  insertOption.run(q3.lastInsertRowid, 'https', 1, 2);

  // Question 4: Single choice
  const q4 = insertQuestion.run(
    testId,
    'Что такое двухфакторная аутентификация (2FA)?',
    'single',
    1,
    4,
    'Двухфакторная аутентификация требует подтверждения личности двумя разными способами (например, пароль + код из SMS или приложения).'
  );
  insertOption.run(q4.lastInsertRowid, 'Ввод двух разных паролей при входе в систему', 0, 1);
  insertOption.run(q4.lastInsertRowid, 'Способ подтверждения личности двумя независимыми факторами (пароль + код из приложения)', 1, 2);
  insertOption.run(q4.lastInsertRowid, 'Авторизация одновременно с двух компьютеров', 0, 3);
  insertOption.run(q4.lastInsertRowid, 'Проверка почты раз в две недели', 0, 4);

  console.log('Sample demo test seeded successfully!');
}

module.exports = db;
