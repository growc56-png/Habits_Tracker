# Habits Tracker — контракт API для backend

Frontend больше не хранит привычки и учёт времени в localStorage. Все пользовательские данные читаются и изменяются через API. В localStorage остаются только access token и визуальная тема. Pomodoro работает в браузере, но завершённые рабочие интервалы отправляет на сервер.

## Общие требования

- Base URL по умолчанию: `http://127.0.0.1:8000`.
- JSON для запросов и ответов.
- Для защищённых маршрутов: `Authorization: Bearer <access_token>`.
- Авторизация: JWT access token. `POST /login` возвращает `{"access_token":"...","token_type":"bearer","user":{"id":1,"username":"..."} }`.
- `GET /me` возвращает `{"id":1,"username":"..." }`.
- Ошибки: HTTP 4xx/5xx и JSON `{"detail":"понятное сообщение"}`.

## Уже существующая регистрация

### POST /registration
Body: `{"username":"semen","password":"secret"}`.
Создаёт пользователя. Успех — HTTP 201 и `{"ok":true,"message":"created"}`. Имя занято — HTTP 409.

### POST /login
Body: `{"username":"semen","password":"secret"}`.
Проверяет пароль и выдаёт JWT. Неверные данные — HTTP 401.

## Ручки, которые нужно реализовать

### 1. GET /me
Проверяет токен и возвращает текущего пользователя.
Response: `{"id":1,"username":"semen"}`.

### 2. GET /habits
Возвращает привычки текущего пользователя.
Response: `{"items":[{"id":12,"name":"Читать","description":"20 страниц","category":"Обучение","icon":"📚","completed_today":false,"completed_date":null}]}`.

### 3. POST /habits
Создаёт привычку.
Body: `{"name":"Читать","description":"20 страниц","category":"Обучение","icon":"📚"}`.
Response: созданный объект привычки с `id`.

### 4. PATCH /habits/{habit_id}
Изменяет название, описание, категорию или иконку.
Body: те же поля, можно прислать изменяемые поля.

### 5. POST /habits/{habit_id}/toggle
Переключает состояние выполнения привычки на сегодня. Сервер сам ставит/снимает сегодняшнюю дату. Возвращает обновлённую привычку.

### 6. DELETE /habits/{habit_id}
Удаляет привычку. Ответ HTTP 204. Проверять, что привычка принадлежит авторизованному пользователю.

### 7. GET /time-entries
Возвращает записи рабочего времени пользователя, новые первыми.
Response: `{"items":[{"id":44,"task_name":"Backend","minutes":50,"source":"pomodoro","created_at":"2026-11-16T16:00:00Z"}]}`.
Frontend сам группирует записи по задаче и считает суммы. Время отдыха не отправляется и не учитывается.

### 8. POST /time-entries
Добавляет запись рабочего времени.
Body: `{"task_name":"Backend","minutes":50,"source":"pomodoro"}`. Для ручного добавления `source` может быть `manual`. Проверить minutes: 1..1440.

## Рекомендуемые таблицы

- users: id, username, password_hash.
- habits: id, user_id (FK), name, description, category, icon, created_at.
- habit_completions: id, habit_id (FK), user_id (FK), completed_on (DATE). Уникальность habit_id + completed_on.
- time_entries: id, user_id (FK), task_name, minutes, source, created_at.

Все выборки и изменения должны фильтроваться по user_id из токена, а не по user_id из тела запроса. Хешируй пароли, не возвращай их клиенту. Для CORS разреши адрес frontend dev-сервера.

## Проверка вручную

1. Зарегистрироваться.
2. Войти и получить access_token.
3. Обновить страницу: данные должны загрузиться с сервера.
4. Создать/изменить/отметить/удалить привычку — проверить GET /habits.
5. Добавить время вручную и завершить Pomodoro — проверить GET /time-entries.
6. Войти под другим пользователем и убедиться, что чужие данные недоступны.
