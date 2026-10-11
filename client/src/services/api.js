const BASE_URL = '/api';

function getAuthHeader() {
  const token = localStorage.getItem('admin_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const api = {
  // Public
  async getPublicTest(code) {
    const res = await fetch(`${BASE_URL}/public/tests/${encodeURIComponent(code)}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Ошибка загрузки теста');
    return data;
  },

  async submitTest(code, payload) {
    const res = await fetch(`${BASE_URL}/public/tests/${encodeURIComponent(code)}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Ошибка отправки ответов');
    return data;
  },

  // Auth
  async login(username, password) {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Неверный логин или пароль');
    localStorage.setItem('admin_token', data.token);
    localStorage.setItem('admin_user', JSON.stringify(data.admin));
    return data;
  },

  logout() {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
  },

  getCurrentAdmin() {
    const user = localStorage.getItem('admin_user');
    return user ? JSON.parse(user) : null;
  },

  async verifyAuth() {
    const token = localStorage.getItem('admin_token');
    if (!token) return null;
    try {
      const res = await fetch(`${BASE_URL}/auth/me`, {
        headers: getAuthHeader(),
      });
      if (!res.ok) {
        this.logout();
        return null;
      }
      const data = await res.json();
      return data.admin;
    } catch {
      return null;
    }
  },

  async changePassword(oldPassword, newPassword) {
    const res = await fetch(`${BASE_URL}/auth/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify({ oldPassword, newPassword }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Ошибка смены пароля');
    return data;
  },

  // Admin Stats & Tests
  async getAdminStats() {
    const res = await fetch(`${BASE_URL}/admin/stats`, {
      headers: getAuthHeader(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Ошибка загрузки статистики');
    return data;
  },

  async getAdminTests() {
    const res = await fetch(`${BASE_URL}/admin/tests`, {
      headers: getAuthHeader(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Ошибка загрузки тестов');
    return data.tests;
  },

  async createTest(payload) {
    const res = await fetch(`${BASE_URL}/admin/tests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Ошибка создания теста');
    return data.test;
  },

  async parseQuizCode(code) {
    const res = await fetch(`${BASE_URL}/admin/tests/parse-code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify({ code }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Kodni tahlil qilishda xatolik');
    return data;
  },

  async importTestFromCode(payload) {
    const res = await fetch(`${BASE_URL}/admin/tests/import-code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Testni import qilishda xatolik');
    if (data.test) {
      data.test.questions_count = data.questions_count || data.questionsCount || 0;
      return data.test;
    }
    return data;
  },

  async importQuestionsFromCode(testId, payload) {
    const res = await fetch(`${BASE_URL}/admin/tests/${testId}/import-questions-code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Savollarni import qilishda xatolik');
    return data;
  },

  async getAdminTest(id) {
    const res = await fetch(`${BASE_URL}/admin/tests/${id}`, {
      headers: getAuthHeader(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Ошибка загрузки теста');
    return data;
  },

  async updateTest(id, payload) {
    const res = await fetch(`${BASE_URL}/admin/tests/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Ошибка обновления теста');
    return data.test;
  },

  async toggleTest(id) {
    const res = await fetch(`${BASE_URL}/admin/tests/${id}/toggle`, {
      method: 'PUT',
      headers: getAuthHeader(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Ошибка изменения статуса');
    return data;
  },

  async deleteTest(id) {
    const res = await fetch(`${BASE_URL}/admin/tests/${id}`, {
      method: 'DELETE',
      headers: getAuthHeader(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Ошибка удаления теста');
    return data;
  },

  async saveQuestions(testId, questions) {
    const res = await fetch(`${BASE_URL}/admin/tests/${testId}/questions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify({ questions }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Ошибка сохранения вопросов');
    return data;
  },

  async getTestResults(testId, search = '', group = '') {
    const query = new URLSearchParams();
    if (search) query.set('search', search);
    if (group) query.set('group', group);
    const res = await fetch(`${BASE_URL}/admin/tests/${testId}/results?${query.toString()}`, {
      headers: getAuthHeader(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Ошибка загрузки результатов');
    return data;
  },

  async getAttemptDetails(attemptId) {
    const res = await fetch(`${BASE_URL}/admin/attempts/${attemptId}`, {
      headers: getAuthHeader(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Ошибка загрузки детализации попытки');
    return data;
  },

  async deleteAttempt(attemptId) {
    const res = await fetch(`${BASE_URL}/admin/attempts/${attemptId}`, {
      method: 'DELETE',
      headers: getAuthHeader(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Ошибка удаления попытки');
    return data;
  },
};
