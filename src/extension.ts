import * as vscode from "vscode";

// ============================================================
// НАСТРОЙКИ
// ============================================================

// Команда, которую отслеживаем.
// Будут срабатывать:
//
// racket
// racket hello.rkt
// racket test.rkt --foo bar
// racket --version
//
// Но НЕ:
//
// my-racket
// foo-racket-test
//
const TARGET_COMMAND = "racket";

// GIF
const GIF_FILE = "cat.gif";

// Через сколько миллисекунд скрывать GIF.
// 10000 = 10 секунд.
const GIF_DURATION = 10000;


// ============================================================
// GIF VIEW
// ============================================================

class GifViewProvider implements vscode.WebviewViewProvider {

    public static readonly viewType = "gif-view";

    private view?: vscode.WebviewView;

    private hideTimer?: NodeJS.Timeout;

    constructor(
        private readonly extensionUri: vscode.Uri
    ) {
    }

    resolveWebviewView(
        webviewView: vscode.WebviewView
    ): void {

        this.view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [
                vscode.Uri.joinPath(
                    this.extensionUri,
                    "media"
                )
            ]
        };

        webviewView.webview.html =
            this.getHtml(webviewView.webview);

        webviewView.onDidDispose(() => {
            this.view = undefined;
        });
    }


    // ========================================================
    // ПОКАЗАТЬ GIF
    // ========================================================

    public showGif(): void {

        if (!this.view) {
            return;
        }

        // Отменяем предыдущий таймер.
        if (this.hideTimer) {
            clearTimeout(this.hideTimer);
        }

        // Отправляем сообщение в WebView.
        this.view.webview.postMessage({
            command: "show"
        });

        // Через GIF_DURATION скрываем.
        this.hideTimer = setTimeout(() => {

            this.view?.webview.postMessage({
                command: "hide"
            });

        }, GIF_DURATION);
    }


    // ========================================================
    // HTML
    // ========================================================

    private getHtml(
        webview: vscode.Webview
    ): string {

        const gifUri = webview.asWebviewUri(
            vscode.Uri.joinPath(
                this.extensionUri,
                "media",
                GIF_FILE
            )
        );

        return `
< !DOCTYPE
html >

<html lang = "en" >

<head>

    <meta charset = "UTF-8" >

    <style>

        html,
    body
{
    margin: 0;
    padding: 0;

    width: 100 %;
    height: 100 %;

    overflow: hidden;

    background: transparent;
}

#container
{

    width: 100 %;
    height: 100 %;

    display: flex;

    justify - content
:
    center;
    align - items
:
    center;

    background: var (
    --vscode - sideBar - background
)
    ;

    opacity: 0;

    transition: opacity
    0.2
    s
    ease;

    pointer - events
:
    none;
}

#container.visible
{
    opacity: 1;
}

img
{

    max - width
:
    95 %;
    max - height
:
    95 %;

    object - fit
:
    contain;
}

</style>

< /head>

< body >

<div id = "container" >

<img
    src = "${gifUri}"
alt = "GIF"
    >

    </div>


    < script >

const vscode = acquireVsCodeApi();

const container =
    document.getElementById("container");


window.addEventListener(
    "message",
    event => {

        const message = event.data;

        if (message.command === "show") {

            // Перезапускаем GIF.
            const img =
                container.querySelector("img");

            const src = img.src;

            img.src = "";

            img.src = src;

            container.classList.add("visible");
        }

        if (message.command === "hide") {

            container.classList.remove("visible");
        }
    }
);

</script>

< /body>

< /html>
    `;
    }
}


// ============================================================
// ACTIVATE
// ============================================================

export function activate(
    context: vscode.ExtensionContext
) {

    const gifProvider =
        new GifViewProvider(
            context.extensionUri
        );


    // Регистрируем GIF View.

    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(
            GifViewProvider.viewType,
            gifProvider
        )
    );


    // ========================================================
    // ОТСЛЕЖИВАЕМ КОМАНДЫ ТЕРМИНАЛА
    // ========================================================

    const terminalListener =
        vscode.window.onDidStartTerminalShellExecution(
            (event) => {

                const command =
                    event.execution.commandLine.value.trim();

                console.log(
                    "Terminal command:",
                    command
                );


                // Проверяем, начинается ли команда
                // именно с "racket".
                //
                // Примеры:
                //
                // racket
                // racket hello.rkt
                // racket test.rkt --foo
                //
                // true
                //
                // my-racket
                // foo racket
                //
                // false

                const isRacketCommand =
                    new RegExp(
                        "^" +
                        TARGET_COMMAND +
                        "(\\s|$)"
                    ).test(command);


                if (isRacketCommand) {

                    gifProvider.showGif();
                }
            }
        );


    context.subscriptions.push(
        terminalListener
    );
}


// ============================================================
// DEACTIVATE
// ============================================================

export function deactivate() {
}
