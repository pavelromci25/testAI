# Nebula Server

Бэкенд для Telegram Mini App Nebula - игрового портала в Telegram.

## Особенности

- Express + MongoDB
- API для пользователей, игр и реферальной системы
- Интеграция с Telegram Mini App

## Установка

```bash
# Клонировать репозиторий
git clone https://github.com/pavelromci25/nebula-server.git
cd nebula-server

# Установить зависимости
npm install

# Настроить переменные окружения
cp .env.example .env
# Отредактировать .env файл с вашими данными MongoDB

# Запустить в режиме разработки
npm run dev
```

## Скрипты

- `npm start` - Запустить сервер
- `npm run dev` - Запустить сервер с автоматической перезагрузкой (nodemon)

## API Endpoints

### Пользователи
- `GET /api/user/:id` - Получить данные пользователя
- `POST /api/user/update` - Обновить данные пользователя

### Игры
- `GET /api/games` - Получить список игр

### Реферальная система
- `POST /api/referral` - Добавить реферала

### Награды
- `POST /api/coins` - Добавить монеты пользователю

## Деплой на Render

1. Создайте новый Web Service на Render
2. Подключите GitHub репозиторий
3. Установите:
   - Build Command: `npm install`
   - Start Command: `npm start`
4. Добавьте переменные окружения:
   - `MONGODB_URI`: ваша строка подключения к MongoDB
   - `PORT`: 10000

## Структура проекта

```
nebula-server/
├── server.js           # Главный файл сервера
├── .env                # Переменные окружения
└── package.json        # Зависимости
```

## Требования

- Node.js 14+
- MongoDB