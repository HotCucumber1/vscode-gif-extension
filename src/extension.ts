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

// GIF внутри extension/media/
const GIF_FILE = "cat.gif";

// Сколько миллисекунд показывать GIF.
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


    // --------------------------------------------------------
    // Слушаем запуск команд в терминале.
    // --------------------------------------------------------

    const terminalListener =
        vscode.window.onDidStartTerminalShellExecution(
            (event) => {

                const command =
                    event.execution.commandLine.value.trim();


                console.log(
                    "[GIF Extension] Terminal command:",
                    command
                );


                // ------------------------------------------------
                // Проверяем команду.
                // ------------------------------------------------

                const commandRegex =
                    new RegExp(
                        "^" +
                        escapeRegExp(TARGET_COMMAND) +
                        "(\\s|$)"
                    );


                if (!commandRegex.test(command)) {

                    console.log(
                        "[GIF Extension] Command ignored"
                    );

                    return;
                }


                console.log(
                    "[GIF Extension] TARGET COMMAND FOUND"
                );


                showGif(
                    context
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
    context: vscode.ExtensionContext
): void {

    // --------------------------------------------------------
    // Если вкладка уже существует —
    // просто показываем её.
    // --------------------------------------------------------

    if (gifPanel) {

        gifPanel.reveal(
            vscode.ViewColumn.Beside,
            true
        );

        restartGif();

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
    // HTML WebView.
    // --------------------------------------------------------

    gifPanel.webview.html =
        getHtml(
            gifPanel.webview,
            context.extensionUri
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
    // Показываем GIF.
    // --------------------------------------------------------

    restartGif();
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
    }


    // --------------------------------------------------------
    // Сообщаем WebView:
    // показать и перезапустить GIF.
    // --------------------------------------------------------

    gifPanel.webview.postMessage({
        command: "show"
    });


    // --------------------------------------------------------
    // Через GIF_DURATION скрываем.
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
    extensionUri: vscode.Uri
): string {

    const gifUri =
        webview.asWebviewUri(
            vscode.Uri.joinPath(
                extensionUri,
                "media",
                GIF_FILE
            )
        );


    return `
<!DOCTYPE html>

<html lang="en">

<head>

    <meta charset="UTF-8">

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


img {

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


window.addEventListener(
    "message",
    event => {

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

    if (hideTimer) {

        clearTimeout(
            hideTimer
        );
    }


    if (gifPanel) {

        gifPanel.dispose();

        gifPanel = undefined;
    }
}
