const express = require('express');
const router = express.Router();
const db = require('../db');

// Helper to shuffle array
function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// GET /api/public/tests/:code - Get test questions for student (SECURE: NO is_correct sent!)
router.get('/tests/:code', (req, res) => {
  const { code } = req.params;

  const test = db.prepare('SELECT id, title, description, access_code, time_limit_minutes, passing_score, shuffle_questions, shuffle_options, show_results, is_active FROM tests WHERE access_code = ?').get(code);

  if (!test) {
    return res.status(404).json({ error: 'Тест с таким кодом не найден' });
  }

  if (!test.is_active) {
    return res.status(403).json({ error: 'Этот тест в данный момент приостановлен или недоступен для прохождения' });
  }

  const rawQuestions = db.prepare('SELECT id, test_id, question_text, question_type, points, order_num FROM questions WHERE test_id = ? ORDER BY order_num ASC, id ASC').all(test.id);

  let questions = rawQuestions.map(q => {
    // Include is_correct for immediate feedback upon selection
    let options = db.prepare('SELECT id, question_id, option_text, is_correct, order_num FROM options WHERE question_id = ? ORDER BY order_num ASC, id ASC').all(q.id);

    if (test.shuffle_options && q.question_type !== 'text') {
      options = shuffleArray(options);
    }

    return {
      id: q.id,
      question_text: q.question_text,
      question_type: q.question_type,
      points: q.points,
      order_num: q.order_num,
      explanation: q.explanation,
      options: options.map(o => ({
        ...o,
        is_correct: o.is_correct === 1,
      })),
    };
  });

  if (test.shuffle_questions) {
    questions = shuffleArray(questions);
  }

  res.json({
    test: {
      id: test.id,
      title: test.title,
      description: test.description,
      access_code: test.access_code,
      time_limit_minutes: test.time_limit_minutes,
      passing_score: test.passing_score,
      show_results: test.show_results,
      question_count: questions.length,
    },
    questions,
  });
});

// POST /api/public/tests/:code/submit - Grade and save test attempt
router.post('/tests/:code/submit', (req, res) => {
  const { code } = req.params;
  const studentName = (req.body.student_name || req.body.studentName || '').trim();
  const studentGroup = (req.body.student_group || req.body.studentGroup || '').trim();
  const startedAt = req.body.started_at || req.body.startedAt || new Date().toISOString();
  const durationSeconds = Number(req.body.duration_seconds ?? req.body.durationSeconds ?? 0);
  const rawAnswers = req.body.answers;

  if (!studentName) {
    return res.status(400).json({ 
      error: 'Iltimos, ism va familiyangizni kiriting / Пожалуйста, укажите имя и фамилию' 
    });
  }

  const test = db.prepare('SELECT * FROM tests WHERE access_code = ?').get(code);
  if (!test) {
    return res.status(404).json({ error: 'Тест не найден' });
  }
  if (!test.is_active) {
    return res.status(403).json({ error: 'Прием ответов по данному тесту завершен' });
  }

  // Normalize answers into a lookup map: { [questionId]: value }
  const answersMap = {};
  if (Array.isArray(rawAnswers)) {
    for (const item of rawAnswers) {
      if (!item) continue;
      const qId = item.question_id || item.questionId;
      if (qId !== undefined) {
        if (item.selected_option_ids !== undefined) {
          answersMap[qId] = item.selected_option_ids;
        } else if (item.text_answer !== undefined) {
          answersMap[qId] = item.text_answer;
        } else if (item.value !== undefined) {
          answersMap[qId] = item.value;
        }
      }
    }
  } else if (rawAnswers && typeof rawAnswers === 'object') {
    Object.assign(answersMap, rawAnswers);
  }

  const questions = db.prepare('SELECT * FROM questions WHERE test_id = ? ORDER BY order_num ASC, id ASC').all(test.id);

  let totalScore = 0;
  let maxScore = 0;
  const gradedQuestions = [];

  for (const q of questions) {
    maxScore += q.points;
    const allOptions = db.prepare('SELECT * FROM options WHERE question_id = ?').all(q.id);
    const userAnswer = answersMap[q.id];

    let isCorrect = false;
    let pointsAwarded = 0;
    let selectedOptionIds = null;
    let textAnswer = null;

    if (q.question_type === 'single') {
      const selectedId = Array.isArray(userAnswer) ? Number(userAnswer[0]) : Number(userAnswer);
      selectedOptionIds = selectedId ? [selectedId] : [];
      const correctOption = allOptions.find(o => o.is_correct === 1);
      if (correctOption && selectedId === correctOption.id) {
        isCorrect = true;
        pointsAwarded = q.points;
      }
    } else if (q.question_type === 'multiple') {
      const selectedIds = Array.isArray(userAnswer)
        ? userAnswer.map(Number)
        : (userAnswer !== undefined && userAnswer !== null ? [Number(userAnswer)] : []);
      selectedOptionIds = selectedIds;
      const correctOptionIds = allOptions.filter(o => o.is_correct === 1).map(o => o.id);

      const allCorrectSelected = correctOptionIds.every(id => selectedIds.includes(id));
      const noExtraSelected = selectedIds.every(id => correctOptionIds.includes(id));

      if (allCorrectSelected && noExtraSelected && correctOptionIds.length > 0) {
        isCorrect = true;
        pointsAwarded = q.points;
      }
    } else if (q.question_type === 'text') {
      textAnswer = (typeof userAnswer === 'string' ? userAnswer : String(userAnswer || '')).trim();
      const validAnswers = allOptions.map(o => o.option_text.trim().toLowerCase());
      if (textAnswer && validAnswers.includes(textAnswer.toLowerCase())) {
        isCorrect = true;
        pointsAwarded = q.points;
      }
    }

    totalScore += pointsAwarded;

    gradedQuestions.push({
      question_id: q.id,
      question_text: q.question_text,
      question_type: q.question_type,
      explanation: q.explanation,
      points_possible: q.points,
      points_awarded: pointsAwarded,
      is_correct: isCorrect,
      selected_option_ids: selectedOptionIds,
      text_answer: textAnswer,
      options: allOptions.map(o => ({
        id: o.id,
        option_text: o.option_text,
        is_correct: o.is_correct === 1,
      })),
    });
  }

  const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100 * 10) / 10 : 0;
  const passed = percentage >= test.passing_score ? 1 : 0;

  // Insert attempt
  const insertAttempt = db.prepare(`
    INSERT INTO attempts (test_id, student_name, student_group, score, max_score, percentage, passed, started_at, completed_at, duration_seconds)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now', 'localtime'), ?)
  `);

  const attemptResult = insertAttempt.run(
    test.id,
    studentName,
    studentGroup,
    totalScore,
    maxScore,
    percentage,
    passed,
    startedAt,
    durationSeconds
  );

  const attemptId = attemptResult.lastInsertRowid;

  // Insert attempt answers
  const insertAnswer = db.prepare(`
    INSERT INTO attempt_answers (attempt_id, question_id, selected_option_ids, text_answer, is_correct, points_awarded)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  for (const g of gradedQuestions) {
    insertAnswer.run(
      attemptId,
      g.question_id,
      g.selected_option_ids ? JSON.stringify(g.selected_option_ids) : null,
      g.text_answer,
      g.is_correct ? 1 : 0,
      g.points_awarded
    );
  }

  res.json({
    attemptId,
    studentName: studentName.trim(),
    studentGroup: (studentGroup || '').trim(),
    score: totalScore,
    maxScore,
    percentage,
    passed: passed === 1,
    passingScore: test.passing_score,
    durationSeconds: Number(durationSeconds) || 0,
    showResults: test.show_results === 1,
    review: test.show_results === 1 ? gradedQuestions : null,
  });
});

module.exports = router;
