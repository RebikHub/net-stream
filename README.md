# NetStream Electron

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
├── index.mjs        # Electron main process (запускает сервер внутри)
├── index.html       # Renderer
├── preload.js       # Preload script
└── assets/client/   # Собранный Vite-бандл (генерируется при сборке)
server/              # Express-сервер (ESM, упаковывается Electron'ом как есть)
client/              # React/Vite клиент (собирается и копируется в src/assets/client)
```

## Запуск

```bash
npm install          # ставит зависимости корня и client/, затем
npm start            # собирает клиент и запускает приложение
npm run build        # только сборка клиента (результат в src/assets/client)
npm run dist         # сборка + установочный пакет (electron-forge make)
npm run dev:server   # сервер в режиме разработки без Electron
```

## Linux: ошибка SUID sandbox

Если `npm start` падает с `The SUID sandbox helper binary was found, but is not configured correctly`, то `chrome-sandbox` из node_modules не имеет setuid-прав. Рекомендуемое решение — разрешить unprivileged user namespaces (постоянно):

```bash
echo 'kernel.apparmor_restrict_unprivileged_userns=0' | sudo tee /etc/sysctl.d/99-unprivileged-userns.conf
sudo sysctl -w kernel.apparmor_restrict_unprivileged_userns=0
```

Либо выставить права на sandbox заново (слетает после каждого `npm install` / обновления electron):

```bash
npm run fix:sandbox
```

На время разработки (`electron-forge start`) Chromium sandbox автоматически отключается флагом `--no-sandbox` (только вне прод-сборки, в packaged приложении sandbox активен).
