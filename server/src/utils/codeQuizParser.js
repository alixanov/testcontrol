const vm = require('vm');

/**
 * Parses quiz code from Google Apps Script, JavaScript array, or JSON.
 * Returns { title, description, questions }
 */
function parseQuizCode(codeStr) {
  if (!codeStr || typeof codeStr !== 'string') {
    return { title: 'Yangi test', description: '', questions: [] };
  }

  const cleanCode = codeStr.trim();
  let title = 'Yangi test';
  let description = '';
  let questions = [];

  // 1. Try extracting title and description from FormApp.create & form.setDescription
  const formAppTitleMatch = cleanCode.match(/FormApp\.create\(\s*["'`]((?:\\.|[^"'`])*)["'`]\s*\)/);
  if (formAppTitleMatch) {
    title = formAppTitleMatch[1].replace(/\\'/g, "'").replace(/\\"/g, '"');
  }

  const formAppDescMatch = cleanCode.match(/form\.setDescription\(\s*["'`]((?:\\.|[^"'`])*)["'`]\s*\)/);
  if (formAppDescMatch) {
    description = formAppDescMatch[1].replace(/\\'/g, "'").replace(/\\"/g, '"');
  }

  // 2. Try executing with Google Apps Script sandbox (FormApp mocks)
  let capturedQuestions = [];
  const mockForm = {
    setDescription: (d) => { if (d) description = String(d); },
    setIsQuiz: () => {},
    addMultipleChoiceItem: () => {
      const qObj = { question_text: '', options: [], points: 1 };
      capturedQuestions.push(qObj);
      return {
        setTitle: (t) => { qObj.question_text = String(t || ''); },
        createChoice: (text, isC) => ({
          option_text: String(text || ''),
          is_correct: isC ? 1 : 0
        }),
        setChoices: (choices) => { qObj.options = Array.isArray(choices) ? choices : []; },
        setPoints: (p) => { qObj.points = Number(p) || 1; },
        setRequired: () => {}
      };
    },
    getEditUrl: () => '',
    getPublishedUrl: () => ''
  };

  try {
    const sandbox = {
      FormApp: {
        create: (t) => {
          if (t) title = String(t);
          return mockForm;
        }
      },
      Logger: { log: () => {} }
    };

    vm.createContext(sandbox);
    vm.runInContext(cleanCode, sandbox, { timeout: 3000 });

    // Look for functions to execute
    const fnNames = Object.keys(sandbox).filter(k => typeof sandbox[k] === 'function' && k !== 'FormApp' && k !== 'Logger');
    for (const fn of fnNames) {
      try {
        sandbox[fn]();
      } catch (err) {
        // Continue if single function errored
      }
    }
  } catch (err) {
    // Sandboxed run failed, fallback to array evaluation
  }

  if (capturedQuestions.length > 0) {
    questions = capturedQuestions
      .filter(q => q.question_text || (q.options && q.options.length > 0))
      .map(q => ({
        question_text: q.question_text || 'Savol',
        question_type: 'single',
        points: q.points || 1,
        options: q.options || []
      }));
  }

  // 3. Fallback: If sandbox execution didn't produce questions, extract array directly
  if (questions.length === 0) {
    questions = extractArrayFromCode(cleanCode);
  }

  // Ensure title fallback
  if (!title || title === 'Yangi test') {
    const altTitleMatch = cleanCode.match(/(?:title|nomi|название)\s*[:=]\s*["'`]((?:\\.|[^"'`])*)["'`]/i);
    if (altTitleMatch) {
      title = altTitleMatch[1];
    }
  }

  return { title, description, questions };
}

/**
 * Extracts and parses any questions array literal [ ... ] or var questions = [ ... ]
 */
function extractArrayFromCode(codeStr) {
  // Try finding array patterns
  const patterns = [
    // questions = [ ... ]
    /(?:(?:var|let|const)\s+(?:questions|savollar|tests|quiz)\s*=\s*|['"]?questions['"]?\s*:\s*)(\[[\s\S]*?\])(?:;|\n\s*(?:for|var|let|const|\/\/|\}))/,
    // Plain array starting with [ {
    /(\[\s*\{[\s\S]*\}\s*\])/
  ];

  for (const pattern of patterns) {
    const match = codeStr.match(pattern);
    if (match && match[1]) {
      try {
        const rawArray = vm.runInNewContext(`(() => (${match[1]}))()`, {}, { timeout: 2000 });
        if (Array.isArray(rawArray) && rawArray.length > 0) {
          return normalizeRawQuestions(rawArray);
        }
      } catch (e) {
        // Try next pattern
      }
    }
  }

  // Try parsing entire codeStr as JSON
  try {
    const parsed = JSON.parse(codeStr);
    if (Array.isArray(parsed)) {
      return normalizeRawQuestions(parsed);
    } else if (parsed && Array.isArray(parsed.questions)) {
      return normalizeRawQuestions(parsed.questions);
    }
  } catch (e) {
    // Not valid JSON
  }

  return [];
}

/**
 * Normalizes raw question objects from various formats
 */
function normalizeRawQuestions(rawList) {
  return rawList.map((item, idx) => {
    const questionText = item.q || item.question || item.question_text || item.title || item.text || `Savol ${idx + 1}`;
    const rawOptions = item.options || item.variants || item.answers || item.choices || [];
    const correctVal = item.correct !== undefined 
      ? item.correct 
      : item.answer !== undefined 
        ? item.answer 
        : item.is_correct;

    let options = [];

    if (Array.isArray(rawOptions)) {
      options = rawOptions.map((opt, optIdx) => {
        if (typeof opt === 'string' || typeof opt === 'number') {
          let isCorrect = 0;
          if (typeof correctVal === 'number' && correctVal === optIdx) {
            isCorrect = 1;
          } else if (typeof correctVal === 'string') {
            const letterMap = { a: 0, b: 1, c: 2, d: 3, e: 4, f: 5 };
            const cleanCorrect = correctVal.trim().toLowerCase();
            if (letterMap[cleanCorrect] !== undefined && letterMap[cleanCorrect] === optIdx) {
              isCorrect = 1;
            } else if (String(opt).trim().toLowerCase() === cleanCorrect) {
              isCorrect = 1;
            }
          } else if (Array.isArray(correctVal) && correctVal.includes(optIdx)) {
            isCorrect = 1;
          }
          return { option_text: String(opt), is_correct: isCorrect };
        } else if (typeof opt === 'object' && opt !== null) {
          return {
            option_text: String(opt.text || opt.option_text || opt.title || opt.name || `Variant ${optIdx + 1}`),
            is_correct: (opt.is_correct || opt.correct || opt.isCorrect) ? 1 : 0
          };
        }
        return { option_text: String(opt), is_correct: 0 };
      });
    }

    // Default to at least one correct if none set and options exist
    if (options.length > 0 && !options.some(o => o.is_correct)) {
      options[0].is_correct = 1;
    }

    return {
      question_text: String(questionText),
      question_type: 'single',
      points: Number(item.points) || 1,
      options
    };
  });
}

module.exports = {
  parseQuizCode
};
