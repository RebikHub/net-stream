# NetStream

Desktop-приложение для стриминга видео через WebTorrent.

## Описание

Electron-обёртка для NetStream — позволяет запускать стриминговый сервис как десктопное приложение.

## Возможности

- 🖥️ Desktop-приложение (Windows, Mac, Linux)
- 🌐 Встроенный веб-сервер для плеера
- 📡 P2P стриминг
- 🎬 VLC интеграция

## Архитектура

```
src/
├── server/         # Express сервер
│   ├── controllers/
│   ├── routes/
│   └── utils/
├── index.mjs       # Electron main process
├── preload.js      # Preload script
└── index.html      # Renderer
```

## Технологии

- Electron
- Node.js
- Express
- WebTorrent

## Запуск

```bash
npm install
npm run dev
```
