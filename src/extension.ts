import * as vscode from "vscode";

// ============================================================
// НАСТРОЙКИ
// ============================================================

// Команда, которую отслеживаем.
//
// Сработает:
//
// racket
// racket hello.rkt
// racket test.rkt --foo bar
// racket --version
//
// НЕ сработает:
//
// my-racket
// foo-racket
// echo racket
//
const TARGET_COMMAND = "racket";


// ============================================================
// GIF
// ============================================================

// Файлы должны находиться:
//
// extension/
// └── media/
//     ├── cat.gif
//     └── error.gif
//
const SUCCESS_GIF = "cat.gif";
const ERROR_GIF = "dog.gif";


// ============================================================
// НАСТРОЙКИ ОТОБРАЖЕНИЯ
// ============================================================

// Сколько миллисекунд показывать GIF.
//
// 10000 = 10 секунд.
const GIF_DURATION = 10000;


// ============================================================
// GLOBAL STATE
// ============================================================

let gifPanel: vscode.WebviewPanel | undefined;

let hideTimer: NodeJS.Timeout | undefined;


// ============================================================
// ACTIVATE
// ============================================================

export function activate(
    context: vscode.ExtensionContext
): void {

    console.log(
        "[GIF Extension] Extension activated"
    );


    // ========================================================
    // СЛУШАЕМ ЗАВЕРШЕНИЕ КОМАНДЫ В ТЕРМИНАЛЕ
    // ========================================================

    const terminalListener =
        vscode.window.onDidEndTerminalShellExecution(
            (event) => {

                const command =
                    event.execution.commandLine.value.trim();


                const exitCode =
                    event.exitCode;


                console.log(
                    "[GIF Extension] Command finished:",
                    command
                );

                console.log(
                    "[GIF Extension] Exit code:",
                    exitCode
                );


                // ------------------------------------------------
                // Проверяем, что это именно TARGET_COMMAND.
                // ------------------------------------------------
                //
                // Сработает:
                //
                // racket
                // racket hello.rkt
                // racket test.rkt --foo bar
                //
                // Не сработает:
                //
                // my-racket
                // foo-racket
                // echo racket
                //
                const commandRegex =
                    new RegExp(
                        "^" +
                        escapeRegExp(TARGET_COMMAND) +
                        "(\\s|$)"
                    );


                if (!commandRegex.test(command)) {

                    console.log(
                        "[GIF Extension] Command ignored:",
                        command
                    );

                    return;
                }


                console.log(
                    "[GIF Extension] TARGET COMMAND FINISHED"
                );


                // ------------------------------------------------
                // Выбираем GIF по коду завершения.
                // ------------------------------------------------

                const gifFile =
                    exitCode === 0
                        ? SUCCESS_GIF
                        : ERROR_GIF;


                console.log(
                    "[GIF Extension] Selected GIF:",
                    gifFile
                );


                showGif(
                    context,
                    gifFile
                );
            }
        );


    context.subscriptions.push(
        terminalListener
    );
}


// ============================================================
// SHOW GIF
// ============================================================

function showGif(
    context: vscode.ExtensionContext,
    gifFile: string
): void {

    // --------------------------------------------------------
    // Если вкладка уже существует —
    // меняем HTML на нужный GIF
    // и показываем её.
    // --------------------------------------------------------

    if (gifPanel) {

        gifPanel.webview.html =
            getHtml(
                gifPanel.webview,
                context.extensionUri,
                gifFile
            );


        gifPanel.reveal(
            vscode.ViewColumn.Beside,
            true
        );


        // Небольшая задержка нужна,
        // чтобы WebView успел загрузить новый HTML.
        setTimeout(
            () => {
                restartGif();
            },
            50
        );


        return;
    }


    // --------------------------------------------------------
    // Создаём новую вкладку Webview.
    // --------------------------------------------------------

    gifPanel =
        vscode.window.createWebviewPanel(
            "racketGif",

            "Racket GIF",

            {
                viewColumn:
                vscode.ViewColumn.Beside,

                preserveFocus: true
            },

            {
                enableScripts: true,

                localResourceRoots: [
                    vscode.Uri.joinPath(
                        context.extensionUri,
                        "media"
                    )
                ]
            }
        );


    // --------------------------------------------------------
    // Устанавливаем HTML.
    // --------------------------------------------------------

    gifPanel.webview.html =
        getHtml(
            gifPanel.webview,
            context.extensionUri,
            gifFile
        );


    // --------------------------------------------------------
    // Если пользователь закрыл вкладку —
    // забываем её.
    // --------------------------------------------------------

    gifPanel.onDidDispose(
        () => {

            gifPanel = undefined;


            if (hideTimer) {

                clearTimeout(
                    hideTimer
                );

                hideTimer = undefined;
            }
        },

        undefined,

        context.subscriptions
    );


    // --------------------------------------------------------
    // Ждём загрузки WebView,
    // затем запускаем GIF.
    // --------------------------------------------------------

    setTimeout(
        () => {
            restartGif();
        },
        100
    );
}


// ============================================================
// RESTART GIF
// ============================================================

function restartGif(): void {

    if (!gifPanel) {
        return;
    }


    // --------------------------------------------------------
    // Отменяем предыдущий таймер.
    // --------------------------------------------------------

    if (hideTimer) {

        clearTimeout(
            hideTimer
        );

        hideTimer = undefined;
    }


    // --------------------------------------------------------
    // Отправляем WebView команду показать GIF.
    // --------------------------------------------------------

    gifPanel.webview.postMessage({
        command: "show"
    });


    // --------------------------------------------------------
    // Через GIF_DURATION скрываем GIF.
    // --------------------------------------------------------

    hideTimer =
        setTimeout(
            () => {

                if (!gifPanel) {
                    return;
                }


                gifPanel.webview.postMessage({
                    command: "hide"
                });


            },
            GIF_DURATION
        );
}


// ============================================================
// HTML
// ============================================================

function getHtml(
    webview: vscode.Webview,
    extensionUri: vscode.Uri,
    gifFile: string
): string {

    // --------------------------------------------------------
    // Получаем безопасный URI файла внутри WebView.
    // --------------------------------------------------------

    const gifUri =
        webview.asWebviewUri(
            vscode.Uri.joinPath(
                extensionUri,
                "media",
                gifFile
            )
        );


    // --------------------------------------------------------
    // HTML WebView.
    // --------------------------------------------------------

    return `
<!DOCTYPE html>

<html lang="en">

<head>

    <meta charset="UTF-8">

<meta
    name="viewport"
content="width=device-width, initial-scale=1.0"
    >

    <style>

        html,
    body {

    margin: 0;
    padding: 0;

    width: 100%;
    height: 100%;

    overflow: hidden;

    background: transparent;
}


#container {

    width: 100%;
    height: 100%;

    display: flex;

    justify-content: center;
    align-items: center;

    opacity: 0;

    transition:
        opacity 0.2s ease;
}


#container.visible {

    opacity: 1;
}


#gif {

    max-width: 95%;
    max-height: 95%;

    object-fit: contain;
}

</style>

</head>


<body>

<div id="container">

<img
    id="gif"
src="${gifUri}"
alt="Racket GIF"
    >

    </div>


    <script>

const vscode =
    acquireVsCodeApi();


const container =
    document.getElementById(
        "container"
    );


const img =
    document.getElementById(
        "gif"
    );


// ====================================================
// MESSAGE HANDLER
// ====================================================

window.addEventListener(
    "message",
    (event) => {

        const message =
            event.data;


        // --------------------------------------------
        // SHOW
        // --------------------------------------------

        if (
            message.command === "show"
        ) {

            if (img) {

                const src =
                    img.src;


                // Перезапускаем GIF.
                //
                // Установка пустого src,
                // затем возврат исходного src
                // заставляет браузер начать GIF заново.

                img.src = "";

                img.src = src;
            }


            if (container) {

                container.classList.add(
                    "visible"
                );
            }
        }


        // --------------------------------------------
        // HIDE
        // --------------------------------------------

        if (
            message.command === "hide"
        ) {

            if (container) {

                container.classList.remove(
                    "visible"
                );
            }
        }

    }
);

</script>

</body>

</html>
    `;
}


// ============================================================
// ESCAPE REGEXP
// ============================================================

function escapeRegExp(
    value: string
): string {

    return value.replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
    );
}


// ============================================================
// DEACTIVATE
// ============================================================

export function deactivate(): void {

    // --------------------------------------------------------
    // Останавливаем таймер.
    // --------------------------------------------------------

    if (hideTimer) {

        clearTimeout(
            hideTimer
        );

        hideTimer = undefined;
    }


    // --------------------------------------------------------
    // Закрываем WebView.
    // --------------------------------------------------------

    if (gifPanel) {

        gifPanel.dispose();

        gifPanel = undefined;
    }
}
