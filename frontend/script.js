const API = 'http://127.0.0.1:8000';

// ===== Состояние =====
let habits = [];
let selectedIcon = '✅';

// ===== Инициализация =====
document.addEventListener('DOMContentLoaded', () => {
    loadUser();
    loadHabits();
    setupTheme();
    setupForm();
    setupLogout();
});

// ===== Пользователь =====
function loadUser() {
    const name = localStorage.getItem('username') || 'друг';
    document.getElementById('userName').textContent = name;
}

// ===== Тема =====
function setupTheme() {
    const toggle = document.getElementById('themeToggle');
    const saved = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', saved);
    toggle.textContent = saved === 'dark' ? '🌙' : '☀️';

    toggle.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('theme', next);
        toggle.textContent = next === 'dark' ? '🌙' : '☀️';
    });
}

// ===== Загрузка привычек =====
async function loadHabits() {
    try {
        const res = await fetch(`${API}/habits`, { credentials: 'include' });
        if (res.ok) {
            habits = await res.json();
        }
    } catch (e) {
        habits = JSON.parse(localStorage.getItem('habits') || '[]');
    }
    renderHabits();
    updateStats();
}

// ===== Отрисовка =====
function renderHabits() {
    const list = document.getElementById('habitsList');
    const empty = document.getElementById('emptyState');

    if (habits.length === 0) {
        list.innerHTML = '';
        empty.classList.add('visible');
        return;
    }

    empty.classList.remove('visible');
    list.innerHTML = habits.map((h, i) => `
        <div class="habit-card ${h.done ? 'done' : ''}">
            <div class="habit-header">
                <span class="habit-icon">${h.icon || '✅'}</span>
                <span class="habit-category">${h.category || 'Другое'}</span>
            </div>
            <div class="habit-name">${h.name}</div>
            ${h.description ? `<div class="habit-description">${h.description}</div>` : ''}
            <div class="habit-actions">
                <button class="btn-done ${h.done ? 'active' : ''}" onclick="toggleDone(${i})">
                    ${h.done ? '✓ Выполнено' : 'Отметить'}
                </button>
                <button class="btn-delete" onclick="deleteHabit(${i})">✕</button>
            </div>
        </div>
    `).join('');
}

// ===== Статистика =====
function updateStats() {
    document.getElementById('totalHabits').textContent = habits.length;
    document.getElementById('doneToday').textContent = habits.filter(h => h.done).length;
    document.getElementById('streakMax').textContent = habits.reduce((max, h) => Math.max(max, h.streak || 0), 0);
}

// ===== Добавление =====
function setupForm() {
    // Выбор иконки
    document.querySelectorAll('.icon-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.icon-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedIcon = btn.dataset.icon;
        });
    });

    // Отправка формы
    document.getElementById('habitForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('habitName').value.trim();
        const description = document.getElementById('habitDescription').value.trim();
        const category = document.getElementById('habitCategory').value;

        if (!name) return;

        const newHabit = { name, description, category, icon: selectedIcon, done: false, streak: 0 };
        habits.push(newHabit);
        saveHabits();
        renderHabits();
        updateStats();

        // Отправка на бэкенд
        try {
            await fetch(`${API}/habits/create`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ name, description, category, icon: selectedIcon, done: false })
            });
        } catch (e) {
            console.log('Офлайн-режим: привычка сохранена локально');
        }

        // Очистка формы
        document.getElementById('habitName').value = '';
        document.getElementById('habitDescription').value = '';
    });
}

// ===== Переключение выполнения =====
function toggleDone(index) {
    habits[index].done = !habits[index].done;
    saveHabits();
    renderHabits();
    updateStats();
}

// ===== Удаление =====
function deleteHabit(index) {
    habits.splice(index, 1);
    saveHabits();
    renderHabits();
    updateStats();
}

// ===== Сохранение =====
function saveHabits() {
    localStorage.setItem('habits', JSON.stringify(habits));
}

// ===== Выход =====
function setupLogout() {
    document.getElementById('logoutBtn').addEventListener('click', () => {
        localStorage.removeItem('username');
        localStorage.removeItem('habits');
        window.location.href = 'login.html';
    });
}