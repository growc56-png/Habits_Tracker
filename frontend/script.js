const API_BASE = "http://127.0.0.1:8000";
const USER_KEY = "username";
const THEME_KEY = "theme";

const state = {
  habits: [],
  filter: "all",
  search: "",
  selectedIcon: "🌱",
  editingId: null,
  toastTimer: null
};

const $ = (selector) => document.querySelector(selector);

function escapeHtml(value) {
  return String(value == null ? "" : value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[char]);
}

async function apiRequest(path, options) {
  const config = options || {};
  const headers = Object.assign({}, config.headers || {});
  if (config.body && !headers["Content-Type"]) headers["Content-Type"] = "application/json";

  const response = await fetch(API_BASE + path, Object.assign({}, config, {
    headers,
    credentials: "include"
  }));

  const raw = await response.text();
  let data = null;
  try { data = raw ? JSON.parse(raw) : null; } catch (_) { data = { detail: raw }; }

  if (!response.ok) {
    const message = data && (data.detail || data.message || data.error);
    const error = new Error(message || "Ошибка сервера (" + response.status + ")");
    error.status = response.status;
    throw error;
  }
  return data;
}

function showToast(message, isError) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.toggle("error", Boolean(isError));
  toast.classList.add("show");
  window.clearTimeout(state.toastTimer);
  state.toastTimer = window.setTimeout(() => toast.classList.remove("show"), 3200);
}

function setTheme(theme) {
  document.body.dataset.theme = theme;
  localStorage.setItem(THEME_KEY, theme);
  const icon = $("#themeToggle use");
  if (icon) icon.setAttribute("href", theme === "dark" ? "#i-sun" : "#i-moon");
  const button = $("#themeToggle");
  if (button) button.title = theme === "dark" ? "Светлая тема" : "Тёмная тема";
}

function initTheme() {
  setTheme(localStorage.getItem(THEME_KEY) || "dark");
  $("#themeToggle").addEventListener("click", () => {
    setTheme(document.body.dataset.theme === "dark" ? "light" : "dark");
  });
}

function initUser() {
  const username = localStorage.getItem(USER_KEY);
  if (!username) {
    window.location.replace("auth.html");
    return false;
  }
  $("#userName").textContent = username;
  $("#welcomeName").textContent = username;
  $("#userAvatar").textContent = username.slice(0, 1).toUpperCase();
  return true;
}

function localToday() {
  const now = new Date();
  return new Intl.DateTimeFormat("ru-RU", { weekday: "long", day: "numeric", month: "long" }).format(now);
}

function initDates() {
  $("#todayLabel").textContent = localToday().toUpperCase();
  $("#currentDate").textContent = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long", year: "numeric" }).format(new Date());
}

function normalizeHabit(habit) {
  return {
    id: habit.id,
    habitname: habit.habitname || habit.name || "Без названия",
    description: habit.description || "",
    category: habit.category || "Другое",
    icon: habit.icon || "🌱",
    done: Boolean(habit.done)
  };
}

async function loadHabits() {
  const message = $("#apiMessage");
  message.classList.add("hidden");
  $("#habitsList").innerHTML = '<div class="loading-row"><span class="loading-dot"></span> Загружаем привычки...</div>';
  try {
    const data = await apiRequest("/habits", { method: "GET" });
    const list = Array.isArray(data) ? data : (data && (data.habits || data.items)) || [];
    state.habits = list.map(normalizeHabit);
    render();
  } catch (error) {
    state.habits = [];
    render();
    message.textContent = error.status === 404
      ? "Backend пока не содержит GET /habits. Авторизация уже подключена, но для списка привычек нужно добавить API-ручки. Их контракт записан в frontend/API.md."
      : error.message;
    message.classList.remove("hidden");
    if (error.status === 401) {
      localStorage.removeItem(USER_KEY);
      window.setTimeout(() => window.location.replace("auth.html"), 900);
    }
  }
}

function getVisibleHabits() {
  const query = state.search.trim().toLocaleLowerCase("ru");
  return state.habits.filter((habit) => {
    const matchesFilter = state.filter === "all" ||
      (state.filter === "active" && !habit.done) ||
      (state.filter === "done" && habit.done);
    const haystack = (habit.habitname + " " + habit.description + " " + habit.category).toLocaleLowerCase("ru");
    return matchesFilter && (!query || haystack.includes(query));
  });
}

function renderHabit(habit) {
  const done = habit.done;
  const id = escapeHtml(habit.id);
  const label = done ? "Вернуть" : "Выполнено";
  const toggleIcon = done ? "#i-arrow" : "#i-check";
  return '<article class="habit-row ' + (done ? "completed" : "") + '" data-habit-id="' + id + '">' +
    '<div class="habit-emoji" aria-hidden="true">' + escapeHtml(habit.icon) + '</div>' +
    '<div class="habit-copy"><div class="habit-title-line"><span class="habit-name">' + escapeHtml(habit.habitname) + '</span>' +
    '<span class="habit-category">' + escapeHtml(habit.category) + '</span></div>' +
    (habit.description ? '<div class="habit-description">' + escapeHtml(habit.description) + '</div>' : "") +
    '</div><div class="habit-actions">' +
    '<button class="habit-action toggle ' + (done ? "is-done" : "") + '" type="button" data-action="toggle" aria-label="' + label + '">' +
    '<svg class="icon"><use href="' + toggleIcon + '"></use></svg><span>' + label + '</span></button>' +
    '<button class="habit-action" type="button" data-action="edit" aria-label="Изменить привычку"><svg class="icon"><use href="#i-edit"></use></svg></button>' +
    '<button class="habit-action delete" type="button" data-action="delete" aria-label="Удалить привычку"><svg class="icon"><use href="#i-trash"></use></svg></button>' +
    '</div></article>';
}

function renderCategories() {
  const counts = {};
  state.habits.forEach((habit) => { counts[habit.category] = (counts[habit.category] || 0) + 1; });
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  $("#categoryTotal").textContent = entries.length;
  if (!entries.length) {
    $("#categoryList").innerHTML = '<div class="category-placeholder">Категории появятся после добавления привычек.</div>';
    return;
  }
  const max = Math.max.apply(null, entries.map((entry) => entry[1]));
  $("#categoryList").innerHTML = entries.map((entry) =>
    '<div class="category-item"><div class="category-item-label"><span class="category-dot"></span>' + escapeHtml(entry[0]) +
    '</div><span class="category-item-count">' + entry[1] + '</span><div class="category-bar"><span style="width:' +
    Math.round(entry[1] / max * 100) + '%"></span></div></div>'
  ).join("");
}

function render() {
  const total = state.habits.length;
  const done = state.habits.filter((habit) => habit.done).length;
  const active = total - done;
  const percent = total ? Math.round(done / total * 100) : 0;

  $("#totalHabits").textContent = total;
  $("#doneToday").textContent = done;
  $("#remaining").textContent = active;
  $("#progressValue").innerHTML = percent + '<span class="percent">%</span>';
  $("#progressBar").style.width = percent + "%";
  $("#navHabitCount").textContent = total;
  $("#allCount").textContent = total;
  $("#activeCount").textContent = active;
  $("#doneCount").textContent = done;

  document.querySelectorAll("[data-filter]").forEach((button) => {
    const selected = button.dataset.filter === state.filter;
    button.classList.toggle("active", selected);
    button.setAttribute("aria-pressed", String(selected));
  });

  const visible = getVisibleHabits();
  $("#habitsList").innerHTML = visible.map(renderHabit).join("");
  const noHabits = state.habits.length === 0;
  const noMatches = !noHabits && visible.length === 0;
  $("#emptyState").classList.toggle("hidden", visible.length > 0);
  $("#emptyTitle").textContent = noHabits ? "Здесь пока пусто" : "Ничего не найдено";
  $("#emptyDescription").textContent = noHabits
    ? "Добавь первую привычку — и начни создавать свою систему."
    : "Попробуй изменить поисковый запрос или фильтр.";
  $("#emptyCreateButton").classList.toggle("hidden", !noHabits);
  renderCategories();
}

function selectIcon(icon) {
  state.selectedIcon = icon;
  document.querySelectorAll(".icon-choice").forEach((button) => {
    button.classList.toggle("active", button.dataset.icon === icon);
  });
}

function openModal(habit) {
  state.editingId = habit ? habit.id : null;
  $("#habitForm").reset();
  $("#modalTitle").textContent = habit ? "Изменить привычку" : "Новая привычка";
  $("#saveHabitButton").innerHTML = habit
    ? 'Сохранить изменения <svg class="icon"><use href="#i-arrow"></use></svg>'
    : 'Сохранить привычку <svg class="icon"><use href="#i-arrow"></use></svg>';
  $("#habitName").value = habit ? habit.habitname : "";
  $("#habitDescription").value = habit ? habit.description : "";
  $("#habitCategory").value = habit ? habit.category : "Здоровье";
  selectIcon(habit ? habit.icon : "🌱");
  $("#habitFormError").textContent = "";
  $("#habitModal").classList.remove("hidden");
  document.body.classList.add("modal-open");
  window.setTimeout(() => $("#habitName").focus(), 40);
}

function closeModal() {
  $("#habitModal").classList.add("hidden");
  document.body.classList.remove("modal-open");
  state.editingId = null;
}

async function submitHabit(event) {
  event.preventDefault();
  const payload = {
    habitname: $("#habitName").value.trim(),
    description: $("#habitDescription").value.trim(),
    category: $("#habitCategory").value,
    icon: state.selectedIcon,
    done: false
  };
  if (!payload.habitname) {
    $("#habitFormError").textContent = "Введи название привычки.";
    return;
  }

  const button = $("#saveHabitButton");
  button.disabled = true;
  $("#habitFormError").textContent = "";
  try {
    if (state.editingId !== null) {
      delete payload.done;
      await apiRequest("/habits/" + encodeURIComponent(state.editingId), {
        method: "PUT", body: JSON.stringify(payload)
      });
      showToast("Изменения сохранены.");
    } else {
      await apiRequest("/habits/create", {
        method: "POST", body: JSON.stringify(payload)
      });
      showToast("Привычка добавлена.");
    }
    closeModal();
    await loadHabits();
  } catch (error) {
    $("#habitFormError").textContent = error.status === 404
      ? "Эта API-ручка пока не добавлена в Backend. Смотри frontend/API.md."
      : error.message;
  } finally {
    button.disabled = false;
  }
}

async function toggleHabit(id) {
  try {
    await apiRequest("/habits/" + encodeURIComponent(id) + "/toggle", { method: "POST" });
    await loadHabits();
  } catch (error) {
    showToast(error.message, true);
  }
}

async function deleteHabit(id) {
  const habit = state.habits.find((item) => String(item.id) === String(id));
  if (!habit || !window.confirm('Удалить привычку «' + habit.habitname + '»?')) return;
  try {
    await apiRequest("/habits/" + encodeURIComponent(id), { method: "DELETE" });
    showToast("Привычка удалена.");
    await loadHabits();
  } catch (error) {
    showToast(error.status === 404 ? "Ручка удаления пока не добавлена в Backend." : error.message, true);
  }
}

function initEvents() {
  $("#openCreateButton").addEventListener("click", () => openModal(null));
  $("#emptyCreateButton").addEventListener("click", () => openModal(null));
  $("#closeModalButton").addEventListener("click", closeModal);
  $("#cancelModalButton").addEventListener("click", closeModal);
  $("#habitModal").addEventListener("click", (event) => {
    if (event.target === $("#habitModal")) closeModal();
  });
  $("#habitForm").addEventListener("submit", submitHabit);
  $("#habitSearch").addEventListener("input", (event) => {
    state.search = event.target.value;
    render();
  });
  document.querySelectorAll("[data-filter]").forEach((button) => {
    button.addEventListener("click", () => {
      state.filter = button.dataset.filter;
      render();
    });
  });
  $("#iconPicker").addEventListener("click", (event) => {
    const button = event.target.closest("[data-icon]");
    if (button) selectIcon(button.dataset.icon);
  });
  $("#habitsList").addEventListener("click", (event) => {
    const button = event.target.closest("[data-action]");
    if (!button) return;
    const row = button.closest("[data-habit-id]");
    const id = row && row.dataset.habitId;
    if (!id) return;
    if (button.dataset.action === "toggle") toggleHabit(id);
    if (button.dataset.action === "delete") deleteHabit(id);
    if (button.dataset.action === "edit") {
      const habit = state.habits.find((item) => String(item.id) === String(id));
      if (habit) openModal(habit);
    }
  });
  $("#logoutButton").addEventListener("click", () => {
    localStorage.removeItem(USER_KEY);
    window.location.href = "auth.html";
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !$("#habitModal").classList.contains("hidden")) closeModal();
  });
}

function init() {
  if (!initUser()) return;
  initDates();
  initTheme();
  initEvents();
  loadHabits();
}

document.addEventListener("DOMContentLoaded", init);
