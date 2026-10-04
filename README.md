# VS Code GIF Extension

Расширение для VS Code, которое показывает GIF в боковой панели при выполнении команды `racket` в терминале.

## Как это работает

Расширение отслеживает команды в терминале VS Code. При запуске команды `racket` (с любыми аргументами) в правой боковой панели появляется GIF-анимация, которая автоматически скрывается через 10 секунд.

## Требования

- [Node.js](https://nodejs.org/) (LTS)
- [VS Code](https://code.visualstudio.com/)
- [VSCE](https://marketplace.visualstudio.com/items?itemName=ms-vscode.vsce) (`npm i -g @vscode/vsce`)

## Установка зависимостей и сборка

```bash
npm install
npm run build
```

Команда `npm run build` компилирует TypeScript и создаёт файл `.vsix` для установки.

## Установка расширения

```bash
code --install-extension vscode-gif-extension-0.0.1.vsix
```

После установки в правой боковой панели появится новый контейнер **GIF** с панелью **GIF Player**.

## Настройка

Файл `src/extension.ts` содержит настройки:

| Параметр | Описание |
|---|---|
| `TARGET_COMMAND` | Команда для отслеживания (по умолчанию `racket`) |
| `GIF_FILE` | Имя GIF-файла в папке `media/` |
| `GIF_DURATION` | Время показа в миллисекундах (по умолчанию `10000`) |

## Структура проекта

```
├── media/
│   ├── cat.gif        # GIF-анимация
│   └── icon.svg       # Иконка панели
├── src/
│   └── extension.ts   # Основной код расширения
├── out/               # Скомпилированный JavaScript
├── package.json
└── tsconfig.json
```
