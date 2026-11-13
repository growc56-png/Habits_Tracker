const API_BASE = "http://127.0.0.1:8000";
const USER_KEY = "username";
let authMode = "login";

const $ = (selector) => document.querySelector(selector);

async function request(path, payload) {
  const response = await fetch(API_BASE + path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload)
  });
  const raw = await response.text();
  let data = null;
  try { data = raw ? JSON.parse(raw) : null; } catch (_) { data = { detail: raw }; }
  if (!response.ok) {
    const message = data && (data.detail || data.message || data.error);
    throw new Error(message || "Ошибка сервера (" + response.status + ")");
  }
  return data;
}

function showError(message) {
  const box = $("#authError");
  box.textContent = message;
  box.classList.remove("hidden");
}

function clearError() {
  $("#authError").textContent = "";
  $("#authError").classList.add("hidden");
}

function setMode(mode) {
  authMode = mode;
  const isRegister = mode === "register";
  $("#loginTab").classList.toggle("active", !isRegister);
  $("#registerTab").classList.toggle("active", isRegister);
  $("#loginTab").setAttribute("aria-selected", String(!isRegister));
  $("#registerTab").setAttribute("aria-selected", String(isRegister));
  $("#authKicker").textContent = isRegister ? "СОЗДАЙ СВОЁ ПРОСТРАНСТВО" : "РАДЫ ТЕБЯ ВИДЕТЬ";
  $("#authTitle").textContent = isRegister ? "Создай аккаунт" : "С возвращением!";
  $("#authSubtitle").textContent = isRegister
    ? "Зарегистрируйся, чтобы сохранять свои привычки."
    : "Войди в аккаунт, чтобы продолжить свой путь.";
  $("#confirmField").classList.toggle("hidden", !isRegister);
  $("#passwordConfirm").required = isRegister;
  $("#password").autocomplete = isRegister ? "new-password" : "current-password";
  $("#authSubmit span").textContent = isRegister ? "Зарегистрироваться" : "Войти";
  $("#authBottomNote").innerHTML = isRegister
    ? 'Уже есть аккаунт? <button type="button" id="switchToLogin">Войди</button>'
    : 'Нет аккаунта? <button type="button" id="switchToRegister">Зарегистрируйся</button>';
  clearError();
}

async function submitAuth(event) {
  event.preventDefault();
  clearError();

  const username = $("#username").value.trim();
  const password = $("#password").value;
  const confirm = $("#passwordConfirm").value;

  if (username.length < 3) {
    showError("Имя пользователя должно содержать не менее 3 символов.");
    return;
  }
  if (password.length < 4) {
    showError("Пароль должен содержать не менее 4 символов.");
    return;
  }
  if (authMode === "register" && password !== confirm) {
    showError("Пароли не совпадают.");
    return;
  }

  const button = $("#authSubmit");
  button.disabled = true;
  $("#authSubmit span").textContent = authMode === "register" ? "Создаём аккаунт..." : "Входим...";
  try {
    if (authMode === "register") {
      await request("/register", { username, password });
      await request("/login", { username, password });
    } else {
      await request("/login", { username, password });
    }
    localStorage.setItem(USER_KEY, username);
    window.location.href = "index.html";
  } catch (error) {
    showError(error.message || "Не удалось выполнить запрос. Проверь, запущен ли Backend.");
  } finally {
    button.disabled = false;
    $("#authSubmit span").textContent = authMode === "register" ? "Зарегистрироваться" : "Войти";
  }
}

function setTheme(theme) {
  document.body.dataset.theme = theme;
  localStorage.setItem("theme", theme);
  $("#authThemeToggle .theme-symbol").textContent = theme === "dark" ? "☼" : "☾";
}

function init() {
  const savedTheme = localStorage.getItem("theme") || "dark";
  setTheme(savedTheme);
  $("#authThemeToggle").addEventListener("click", () => {
    setTheme(document.body.dataset.theme === "dark" ? "light" : "dark");
  });
  $("#loginTab").addEventListener("click", () => setMode("login"));
  $("#registerTab").addEventListener("click", () => setMode("register"));
  $("#authBottomNote").addEventListener("click", (event) => {
    if (event.target.id === "switchToRegister") setMode("register");
    if (event.target.id === "switchToLogin") setMode("login");
  });
  $("#authForm").addEventListener("submit", submitAuth);
  $("#passwordToggle").addEventListener("click", () => {
    const field = $("#password");
    field.type = field.type === "password" ? "text" : "password";
  });
  setMode("login");
}

document.addEventListener("DOMContentLoaded", init);
