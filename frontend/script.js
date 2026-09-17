const API_URL = 'http://127.0.0.1:8000';
let currentUserId = null;
let currentFilter = 'all';
let allHabits = [];
let selectedIcon = '📚';



// ===== THEMES =====
function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.theme === theme);
    });
    localStorage.setItem('theme', theme);
}

// LOAD SAVED THEME
const savedTheme = localStorage.getItem('theme') || 'dark';
setTheme(savedTheme);

// ===== ICONS =====
function selectIcon(btn) {
    document.querySelectorAll('.icon-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    selectedIcon = btn.dataset.icon;
    document.getElementById('selected-icon').value = selectedIcon;
}

// ===== АВТОРИЗАЦИЯ =====
function switchToRegister() {
    document.getElementById('login-box').style.display = 'none';
    document.getElementById('register-box').style.display = 'block';
}
function switchToLogin() {
    document.getElementById('register-box').style.display = 'none';
    document.getElementById('login-box').style.display = 'block';
}

async function register() {
    const username = document.getElementById('register-username').value.trim();
    const password = document.getElementById('register-password').value.trim();
    if (!username || !password) return alert('Заполните все поля!');
    try {
        const res = await fetch(`${API_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await res.json();
        if (res.ok) {
            alert('Регистрация успешна! Войдите.');
            switchToLogin();
        } else {
            alert('Ошибка: ' + (data.detail || 'неизвестная ошибка'));
        }
    } catch {
        alert('Сервер не отвечает. Запустите бэкенд.');
    }
}

async function login() {
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value.trim();
    if (!username || !password) return alert('Заполните все поля!');
    try {
        const res = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await res.json();
        if (res.ok) {
            currentUserId = data.user_id;
            document.getElementById('username-display').textContent = `Привет, ${username}`;
            document.getElementById('auth-section').style.display = 'none';
            document.getElementById('habits-section').style.display = 'block';
            document.getElementById('logout-btn').style.display = 'inline';
            loadHabits();
        } else {
            alert('Неверное имя или пароль');
        }
    } catch {
        alert('Сервер не отвечает.');
    }
}

function logout() {
    currentUserId = null;
    document.getElementById('auth-section').style.display = 'block';
    document.getElementById('habits-section').style.display = 'none';
    document.getElementById('logout-btn').style.display = 'none';
    document.getElementById('username-display').textContent = '';
    document.getElementById('habits-list').innerHTML = '<p class="empty-msg">Войдите, чтобы увидеть привычки</p>';
}

// ===== ПРИВЫЧКИ =====
async function loadHabits() {
    if (!currentUserId) return;
    try {
        const res = await fetch(`${API_URL}/habits/get`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: currentUserId })
        });
        allHabits = await res.json();
        applyFilter();
        if (allHabits.length > 0) loadStats(allHabits[0].id);
    } catch {
        alert('Ошибка загрузки привычек. Сервер запущен?');
    }
}

function applyFilter() {
    let filtered = allHabits;
    if (currentFilter !== 'all') {
        filtered = allHabits.filter(h => h.category === currentFilter);
    }
    renderHabits(filtered);
}

function renderHabits(habits) {
    const list = document.getElementById('habits-list');
    if (!habits || habits.length === 0) {
        list.innerHTML = '<p class="empty-msg">Нет привычек в этой категории.</p>';
        return;
    }
    let html = '';
    habits.forEach(h => {
        const checkedClass = h.is_done_today ? 'done' : '';
        const progress = Math.round(h.progress || 0);
        const streak = h.streak || 0;
        html += `
            <div class="habit-card" data-id="${h.id}">
                <div class="habit-icon">${h.icon || '📌'}</div>
                <div class="habit-info">
                    <h3>
                        ${h.name}
                        <span class="category">${h.category || 'Без категории'}</span>
                    </h3>
                    <div class="description">${h.description || ''}</div>
                </div>
                <div class="habit-stats">
                    <div class="streak">🔥 ${streak}</div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${progress}%;"></div>
                    </div>
                    <span style="font-size:12px;">${progress}%</span>
                </div>
                <div class="habit-actions">
                    <div class="checkbox ${checkedClass}" onclick="toggleHabit(${h.id})">
                        ${h.is_done_today ? '✓' : ''}
                    </div>
                    <button class="delete-btn" onclick="deleteHabit(${h.id})">✕</button>
                </div>
            </div>
        `;
    });
    list.innerHTML = html;
}

function filterHabits(category) {
    currentFilter = category;
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.category === category);
    });
    applyFilter();
}

async function addHabit() {
    const name = document.getElementById('new-habit-name').value.trim();
    const description = document.getElementById('new-habit-desc').value.trim();
    const category = document.getElementById('new-habit-category').value;
    const icon = selectedIcon;
    if (!name) return alert('Введите название!');
    try {
        const res = await fetch(`${API_URL}/habits/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: currentUserId, name, description, category, icon })
        });
        if (res.ok) {
            document.getElementById('new-habit-name').value = '';
            document.getElementById('new-habit-desc').value = '';
            loadHabits();
        } else {
            alert('Ошибка создания');
        }
    } catch {
        alert('Сервер не отвечает');
    }
}

async function toggleHabit(habit_id) {
    try {
        const res = await fetch(`${API_URL}/habits/toggle`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ habit_id })
        });
        if (res.ok) {
            loadHabits();
        } else {
            alert('Ошибка при отметке');
        }
    } catch {
        alert('Сервер не отвечает');
    }
}

async function deleteHabit(habit_id) {
    if (!confirm('Удалить привычку?')) return;
    try {
        const res = await fetch(`${API_URL}/habits/delete`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ habit_id })
        });
        if (res.ok) {
            loadHabits();
        } else {
            alert('Ошибка удаления');
        }
    } catch {
        alert('Сервер не отвечает');
    }
}

async function loadStats(habit_id) {
    try {
        const res = await fetch(`${API_URL}/habits/stats`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ habit_id })
        });
        const data = await res.json();
        const container = document.getElementById('stats-content');
        if (!data.days) {
            container.innerHTML = 'Нет данных';
            return;
        }
        let html = `<p>Процент выполнения: <strong>${data.completion_rate}%</strong></p><div class="stats-grid">`;
        data.days.forEach(day => {
            const cls = day.done ? 'done' : 'fail';
            html += `<div class="stats-day ${cls}">${day.date}<br>${day.done ? '✅' : '❌'}</div>`;
        });
        html += '</div>';
        container.innerHTML = html;
    } catch {
        container.innerHTML = 'Ошибка загрузки статистики';
    }
}

// initialization
document.addEventListener('DOMContentLoaded', () => {
    const firstIcon = document.querySelector('.icon-btn');
    if (firstIcon) selectIcon(firstIcon);
});