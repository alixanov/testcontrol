const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const db = require('../db');
const { authenticateAdmin } = require('../middleware/auth');
const { parseQuizCode } = require('../utils/codeQuizParser');

// All admin routes require authentication
router.use(authenticateAdmin);

// Helper to generate unique access code
function generateAccessCode() {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// GET /api/admin/stats - Global statistics
router.get('/stats', (req, res) => {
  const testsCount = db.prepare('SELECT COUNT(*) as total FROM tests').get().total;
  const activeTestsCount = db.prepare('SELECT COUNT(*) as total FROM tests WHERE is_active = 1').get().total;
  const attemptsCount = db.prepare('SELECT COUNT(*) as total FROM attempts').get().total;
  const avgScoreRes = db.prepare('SELECT AVG(percentage) as avg_score FROM attempts').get();
  const avgScore = avgScoreRes.avg_score ? Math.round(avgScoreRes.avg_score * 10) / 10 : 0;

  const recentAttempts = db.prepare(`
    SELECT a.*, t.title as test_title, t.access_code
    FROM attempts a
    JOIN tests t ON a.test_id = t.id
    ORDER BY a.completed_at DESC
    LIMIT 8
  `).all();

  res.json({
    totalTests: testsCount,
    activeTests: activeTestsCount,
    totalAttempts: attemptsCount,
    averageScore: avgScore,
    recentAttempts,
  });
});

// GET /api/admin/tests - List all tests
router.get('/tests', (req, res) => {
  const tests = db.prepare(`
    SELECT t.*,
      (SELECT COUNT(*) FROM questions WHERE test_id = t.id) as questions_count,
      (SELECT COUNT(*) FROM attempts WHERE test_id = t.id) as attempts_count,
      (SELECT AVG(percentage) FROM attempts WHERE test_id = t.id) as avg_score
    FROM tests t
    ORDER BY t.created_at DESC
  `).all();

  const formatted = tests.map(t => ({
    ...t,
    avg_score: t.avg_score !== null ? Math.round(t.avg_score * 10) / 10 : null,
  }));

  res.json({ tests: formatted });
});

// POST /api/admin/tests/parse-code - Preview & parse code snippet
router.post('/tests/parse-code', (req, res) => {
  const { code } = req.body;
  if (!code || !code.trim()) {
    return res.status(400).json({ error: 'Kod matni kiritilmadi' });
  }

  try {
    const result = parseQuizCode(code);
    if (!result.questions || result.questions.length === 0) {
      return res.status(400).json({
        error: 'Kiritilgan koddan savollar topilmadi. Kod formatini tekshiring.',
        parsed: result
      });
    }

    res.json({
      title: result.title,
      description: result.description,
      questionsCount: result.questions.length,
      questions: result.questions
    });
  } catch (err) {
    res.status(400).json({ error: err.message || 'Kodni tahlil qilishda xatolik' });
  }
});

// POST /api/admin/tests/import-code - Create test directly from code
router.post('/tests/import-code', (req, res) => {
  const {
    code,
    title: customTitle,
    description: customDesc,
    access_code,
    time_limit_minutes = 0,
    passing_score = 60,
    shuffle_questions = 0,
    shuffle_options = 0,
    show_results = 1,
    is_active = 1,
    questions: customQuestions
  } = req.body;

  let parsedData = { title: 'Yangi test', description: '', questions: [] };

  if (Array.isArray(customQuestions) && customQuestions.length > 0) {
    parsedData = {
      title: customTitle || 'Yangi test',
      description: customDesc || '',
      questions: customQuestions
    };
  } else if (code) {
    parsedData = parseQuizCode(code);
  }

  if (!parsedData.questions || parsedData.questions.length === 0) {
    return res.status(400).json({ error: 'Kiritilgan koddan savollar topilmadi. Kod formatini tekshiring.' });
  }

  const finalTitle = (customTitle || parsedData.title || 'Yangi test').trim();
  const finalDesc = (customDesc !== undefined ? customDesc : parsedData.description || '').trim();

  let testAccessCode = (access_code || '').trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
  if (!testAccessCode) {
    testAccessCode = generateAccessCode();
  }

  // Check unique code
  const existing = db.prepare('SELECT id FROM tests WHERE access_code = ?').get(testAccessCode);
  if (existing) {
    testAccessCode = generateAccessCode();
  }

  // Insert test and questions inside transaction
  db.exec('BEGIN TRANSACTION;');
  try {
    const insertTest = db.prepare(`
      INSERT INTO tests (title, description, access_code, time_limit_minutes, passing_score, shuffle_questions, shuffle_options, show_results, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const testResult = insertTest.run(
      finalTitle,
      finalDesc,
      testAccessCode,
      Number(time_limit_minutes) || 0,
      Number(passing_score) || 60,
      shuffle_questions ? 1 : 0,
      shuffle_options ? 1 : 0,
      show_results ? 1 : 0,
      is_active ? 1 : 0
    );
    const newTestId = testResult.lastInsertRowid;

    const insertQ = db.prepare(`
      INSERT INTO questions (test_id, question_text, question_type, points, order_num, explanation)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const insertOpt = db.prepare(`
      INSERT INTO options (question_id, option_text, is_correct, order_num)
      VALUES (?, ?, ?, ?)
    `);

    parsedData.questions.forEach((q, qIdx) => {
      const qRes = insertQ.run(
        newTestId,
        q.question_text || `Savol ${qIdx + 1}`,
        q.question_type || 'single',
        Number(q.points) || 1,
        qIdx + 1,
        q.explanation || ''
      );
      const questionId = qRes.lastInsertRowid;

      if (Array.isArray(q.options)) {
        q.options.forEach((opt, oIdx) => {
          insertOpt.run(
            questionId,
            opt.option_text || `Variant ${oIdx + 1}`,
            opt.is_correct ? 1 : 0,
            oIdx + 1
          );
        });
      }
    });

    db.exec('COMMIT;');
    const createdTest = db.prepare('SELECT * FROM tests WHERE id = ?').get(newTestId);
    res.status(201).json({
      message: 'Test muvaffaqiyatli yaratildi',
      test: createdTest,
      questionsCount: parsedData.questions.length,
      questions_count: parsedData.questions.length
    });
  } catch (err) {
    try { db.exec('ROLLBACK;'); } catch (_) {}
    res.status(500).json({ error: err.message || 'Testni import qilishda xatolik' });
  }
});

// POST /api/admin/tests - Create a test
router.post('/tests', (req, res) => {
  const {
    title,
    description = '',
    access_code,
    time_limit_minutes = 0,
    passing_score = 60,
    shuffle_questions = 0,
    shuffle_options = 0,
    show_results = 1,
    is_active = 1,
  } = req.body;

  if (!title || !title.trim()) {
    return res.status(400).json({ error: 'Название теста обязательно' });
  }

  let code = (access_code || '').trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
  if (!code) {
    code = generateAccessCode();
  }

  // Check unique code
  const existing = db.prepare('SELECT id FROM tests WHERE access_code = ?').get(code);
  if (existing) {
    return res.status(400).json({ error: `Код доступа "${code}" уже используется в другом тесте` });
  }

  const insert = db.prepare(`
    INSERT INTO tests (title, description, access_code, time_limit_minutes, passing_score, shuffle_questions, shuffle_options, show_results, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const result = insert.run(
    title.trim(),
    description.trim(),
    code,
    Number(time_limit_minutes) || 0,
    Number(passing_score) || 60,
    shuffle_questions ? 1 : 0,
    shuffle_options ? 1 : 0,
    show_results ? 1 : 0,
    is_active ? 1 : 0
  );

  const testId = result.lastInsertRowid;
  const newTest = db.prepare('SELECT * FROM tests WHERE id = ?').get(testId);
  res.status(201).json({ test: newTest });
});

// GET /api/admin/tests/:id - Get test with questions and options
router.get('/tests/:id', (req, res) => {
  const { id } = req.params;
  const test = db.prepare('SELECT * FROM tests WHERE id = ?').get(id);
  if (!test) {
    return res.status(404).json({ error: 'Тест не найден' });
  }

  const questions = db.prepare('SELECT * FROM questions WHERE test_id = ? ORDER BY order_num ASC, id ASC').all(id);

  const fullQuestions = questions.map(q => {
    const options = db.prepare('SELECT * FROM options WHERE question_id = ? ORDER BY order_num ASC, id ASC').all(q.id);
    return {
      ...q,
      options: options.map(o => ({
        ...o,
        is_correct: Boolean(o.is_correct),
      })),
    };
  });

  res.json({ test, questions: fullQuestions });
});

// PUT /api/admin/tests/:id - Update test details
router.put('/tests/:id', (req, res) => {
  const { id } = req.params;
  const {
    title,
    description,
    access_code,
    time_limit_minutes,
    passing_score,
    shuffle_questions,
    shuffle_options,
    show_results,
    is_active,
  } = req.body;

  const test = db.prepare('SELECT * FROM tests WHERE id = ?').get(id);
  if (!test) {
    return res.status(404).json({ error: 'Тест не найден' });
  }

  let code = (access_code || test.access_code).trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
  if (!code) code = test.access_code;

  if (code !== test.access_code) {
    const existing = db.prepare('SELECT id FROM tests WHERE access_code = ? AND id != ?').get(code, id);
    if (existing) {
      return res.status(400).json({ error: `Код доступа "${code}" уже занят` });
    }
  }

  db.prepare(`
    UPDATE tests
    SET title = ?,
        description = ?,
        access_code = ?,
        time_limit_minutes = ?,
        passing_score = ?,
        shuffle_questions = ?,
        shuffle_options = ?,
        show_results = ?,
        is_active = ?,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
    title !== undefined ? title.trim() : test.title,
    description !== undefined ? description.trim() : test.description,
    code,
    time_limit_minutes !== undefined ? Number(time_limit_minutes) : test.time_limit_minutes,
    passing_score !== undefined ? Number(passing_score) : test.passing_score,
    shuffle_questions !== undefined ? (shuffle_questions ? 1 : 0) : test.shuffle_questions,
    shuffle_options !== undefined ? (shuffle_options ? 1 : 0) : test.shuffle_options,
    show_results !== undefined ? (show_results ? 1 : 0) : test.show_results,
    is_active !== undefined ? (is_active ? 1 : 0) : test.is_active,
    id
  );

  const updatedTest = db.prepare('SELECT * FROM tests WHERE id = ?').get(id);
  res.json({ test: updatedTest });
});

// PUT /api/admin/tests/:id/toggle - Toggle active status
router.put('/tests/:id/toggle', (req, res) => {
  const { id } = req.params;
  const test = db.prepare('SELECT * FROM tests WHERE id = ?').get(id);
  if (!test) {
    return res.status(404).json({ error: 'Тест не найден' });
  }

  const newStatus = test.is_active ? 0 : 1;
  db.prepare('UPDATE tests SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(newStatus, id);
  res.json({ id: Number(id), is_active: newStatus });
});

// DELETE /api/admin/tests/:id - Delete test
router.delete('/tests/:id', (req, res) => {
  const { id } = req.params;
  const test = db.prepare('SELECT * FROM tests WHERE id = ?').get(id);
  if (!test) {
    return res.status(404).json({ error: 'Тест не найден' });
  }

  db.prepare('DELETE FROM tests WHERE id = ?').run(id);
  res.json({ message: 'Тест успешно удален' });
});

// POST /api/admin/tests/:id/save-all - Save or replace entire question list with options
router.post('/tests/:id/questions', (req, res) => {
  const { id } = req.params;
  const { questions } = req.body;

  const test = db.prepare('SELECT * FROM tests WHERE id = ?').get(id);
  if (!test) {
    return res.status(404).json({ error: 'Тест не найден' });
  }

  if (!Array.isArray(questions)) {
    return res.status(400).json({ error: 'Список вопросов должен быть массивом' });
  }

  // Delete current questions (cascades to options)
  db.prepare('DELETE FROM questions WHERE test_id = ?').run(id);

  const insertQ = db.prepare(`
    INSERT INTO questions (test_id, question_text, question_type, points, order_num, explanation)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const insertOpt = db.prepare(`
    INSERT INTO options (question_id, option_text, is_correct, order_num)
    VALUES (?, ?, ?, ?)
  `);

  questions.forEach((q, qIndex) => {
    const qRes = insertQ.run(
      id,
      q.question_text || `Вопрос ${qIndex + 1}`,
      q.question_type || 'single',
      Number(q.points) || 1,
      qIndex + 1,
      q.explanation || ''
    );
    const questionId = qRes.lastInsertRowid;

    if (Array.isArray(q.options)) {
      q.options.forEach((opt, optIndex) => {
        insertOpt.run(
          questionId,
          typeof opt === 'string' ? opt : opt.option_text || '',
          opt.is_correct ? 1 : 0,
          optIndex + 1
        );
      });
    }
  });

  res.json({ message: 'Вопросы успешно сохранены' });
});

// POST /api/admin/tests/:id/import-questions-code - Append or replace questions from code
router.post('/tests/:id/import-questions-code', (req, res) => {
  const { id } = req.params;
  const { code, append = true } = req.body;

  const test = db.prepare('SELECT * FROM tests WHERE id = ?').get(id);
  if (!test) {
    return res.status(404).json({ error: 'Тест не найден' });
  }

  const parsed = parseQuizCode(code);
  if (!parsed.questions || parsed.questions.length === 0) {
    return res.status(400).json({ error: 'Kiritilgan koddan savollar topilmadi. Kod formatini tekshiring.' });
  }

  db.exec('BEGIN TRANSACTION;');
  try {
    if (!append) {
      db.prepare('DELETE FROM questions WHERE test_id = ?').run(id);
    }

    const maxOrderRow = db.prepare('SELECT MAX(order_num) as max_order FROM questions WHERE test_id = ?').get(id);
    let startOrder = (maxOrderRow && maxOrderRow.max_order) ? maxOrderRow.max_order : 0;

    const insertQ = db.prepare(`
      INSERT INTO questions (test_id, question_text, question_type, points, order_num, explanation)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const insertOpt = db.prepare(`
      INSERT INTO options (question_id, option_text, is_correct, order_num)
      VALUES (?, ?, ?, ?)
    `);

    parsed.questions.forEach((q, qIdx) => {
      startOrder += 1;
      const qRes = insertQ.run(
        id,
        q.question_text || `Savol ${startOrder}`,
        q.question_type || 'single',
        Number(q.points) || 1,
        startOrder,
        q.explanation || ''
      );
      const questionId = qRes.lastInsertRowid;

      if (Array.isArray(q.options)) {
        q.options.forEach((opt, oIdx) => {
          insertOpt.run(
            questionId,
            opt.option_text || `Variant ${oIdx + 1}`,
            opt.is_correct ? 1 : 0,
            oIdx + 1
          );
        });
      }
    });

    db.exec('COMMIT;');
    const totalQ = db.prepare('SELECT COUNT(*) as count FROM questions WHERE test_id = ?').get(id).count;
    res.json({
      message: `${parsed.questions.length} ta savol muvaffaqiyatli qo'shildi`,
      importedCount: parsed.questions.length,
      totalQuestions: totalQ
    });
  } catch (err) {
    try { db.exec('ROLLBACK;'); } catch (_) {}
    res.status(500).json({ error: err.message || 'Savollarni import qilishda xatolik' });
  }
});

// GET /api/admin/tests/:id/results - Get student attempts and analytics for a test
router.get('/tests/:id/results', (req, res) => {
  const { id } = req.params;
  const { search = '', group = '' } = req.query;

  const test = db.prepare('SELECT * FROM tests WHERE id = ?').get(id);
  if (!test) {
    return res.status(404).json({ error: 'Тест не найден' });
  }

  let query = 'SELECT * FROM attempts WHERE test_id = ?';
  const params = [id];

  if (search) {
    query += ' AND student_name LIKE ?';
    params.push(`%${search}%`);
  }
  if (group) {
    query += ' AND student_group LIKE ?';
    params.push(`%${group}%`);
  }

  query += ' ORDER BY completed_at DESC';

  const attempts = db.prepare(query).all(...params);

  // Calculate statistics
  const totalAttempts = attempts.length;
  let passCount = 0;
  let totalScoreSum = 0;
  let maxScoreVal = 0;
  let minScoreVal = totalAttempts > 0 ? 100 : 0;

  attempts.forEach(a => {
    if (a.passed) passCount++;
    totalScoreSum += a.percentage;
    if (a.percentage > maxScoreVal) maxScoreVal = a.percentage;
    if (a.percentage < minScoreVal) minScoreVal = a.percentage;
  });

  const avgPercentage = totalAttempts > 0 ? Math.round((totalScoreSum / totalAttempts) * 10) / 10 : 0;
  const passRate = totalAttempts > 0 ? Math.round((passCount / totalAttempts) * 100 * 10) / 10 : 0;

  // Item analysis: question accuracy
  const questions = db.prepare('SELECT id, question_text, points FROM questions WHERE test_id = ? ORDER BY order_num ASC').all(id);
  const questionStats = questions.map(q => {
    const stats = db.prepare(`
      SELECT
        COUNT(*) as total_answers,
        SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) as correct_answers
      FROM attempt_answers
      WHERE question_id = ?
    `).get(q.id);

    const accuracy = stats.total_answers > 0
      ? Math.round((stats.correct_answers / stats.total_answers) * 100 * 10) / 10
      : null;

    return {
      id: q.id,
      text: q.question_text,
      points: q.points,
      totalAnswers: stats.total_answers,
      correctAnswers: stats.correct_answers || 0,
      accuracy,
    };
  });

  // Unique groups for filter dropdown
  const uniqueGroups = db.prepare("SELECT DISTINCT student_group FROM attempts WHERE test_id = ? AND student_group != ''").all(id).map(r => r.student_group);

  res.json({
    test,
    stats: {
      totalAttempts,
      passCount,
      passRate,
      avgPercentage,
      maxScore: maxScoreVal,
      minScore: totalAttempts > 0 ? minScoreVal : 0,
    },
    questionStats,
    uniqueGroups,
    attempts,
  });
});

// GET /api/admin/attempts/:attemptId - Detailed attempt view
router.get('/attempts/:attemptId', (req, res) => {
  const { attemptId } = req.params;

  const attempt = db.prepare(`
    SELECT a.*, t.title as test_title, t.passing_score, t.time_limit_minutes
    FROM attempts a
    JOIN tests t ON a.test_id = t.id
    WHERE a.id = ?
  `).get(attemptId);

  if (!attempt) {
    return res.status(404).json({ error: 'Результат попытки не найден' });
  }

  const answers = db.prepare(`
    SELECT aa.*, q.question_text, q.question_type, q.points as max_question_points, q.explanation
    FROM attempt_answers aa
    JOIN questions q ON aa.question_id = q.id
    WHERE aa.attempt_id = ?
    ORDER BY q.order_num ASC, q.id ASC
  `).all(attemptId);

  const formattedAnswers = answers.map(a => {
    const options = db.prepare('SELECT * FROM options WHERE question_id = ?').all(a.question_id);
    let selectedIds = [];
    try {
      selectedIds = a.selected_option_ids ? JSON.parse(a.selected_option_ids) : [];
    } catch (e) {
      selectedIds = [];
    }

    return {
      ...a,
      selected_option_ids: selectedIds,
      options: options.map(o => ({
        id: o.id,
        option_text: o.option_text,
        is_correct: Boolean(o.is_correct),
      })),
    };
  });

  res.json({
    attempt,
    answers: formattedAnswers,
  });
});

// DELETE /api/admin/attempts/:attemptId - Delete attempt
router.delete('/attempts/:attemptId', (req, res) => {
  const { attemptId } = req.params;
  const attempt = db.prepare('SELECT id FROM attempts WHERE id = ?').get(attemptId);
  if (!attempt) {
    return res.status(404).json({ error: 'Попытка не найдена' });
  }

  db.prepare('DELETE FROM attempts WHERE id = ?').run(attemptId);
  res.json({ message: 'Результат попытки успешно удален' });
});

module.exports = router;
