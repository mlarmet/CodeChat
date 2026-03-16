import * as vscode from "vscode";

import logger from "../utils/logger";

export class WebviewProvider implements vscode.WebviewViewProvider {
	constructor(private readonly extensionUri: vscode.Uri) {}

	resolveWebviewView(webviewView: vscode.WebviewView) {
		webviewView.webview.options = {
			enableScripts: true,
			localResourceRoots: [vscode.Uri.joinPath(this.extensionUri, "dist")],
		};

		webviewView.webview.html = getWebviewContent(webviewView.webview, this.extensionUri);

		// Messages depuis React
		webviewView.webview.onDidReceiveMessage(({ command, data }: IMessageEvent) => {
			switch (command) {
				case "sendMessage":
					webviewView.webview.postMessage({ command: "postMessage", data });
					vscode.window.showInformationMessage("Message envoyé !");
					logger.info(`New message sent: ${JSON.stringify(data || "")}`);
					break;
				case "error":
					vscode.window.showErrorMessage((data as any)?.error || "Une erreur est survenue.");
					logger.error(`Error: ${JSON.stringify(data || "")}`);
					break;
				default:
					break;
			}
		});
	}
}

function getWebviewContent(webview: vscode.Webview, extensionUri: vscode.Uri): string {
	const baseUri = vscode.Uri.joinPath(extensionUri, "dist", "views");

	const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(baseUri, "main.js"));
	const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(baseUri, "main.css"));

	return /* html */ `
    <!DOCTYPE html>
    <html lang="fr">
      <head>
        <meta charset="UTF-8" />
        <meta
          http-equiv="Content-Security-Policy"
          content="default-src 'none'; style-src ${webview.cspSource}; script-src 'unsafe-eval' ${webview.cspSource};"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${APP_NAME}</title>
		<link rel="stylesheet" href="${styleUri}" />
      </head>
      <body>
        <div id="root"></div>
        <script src="${scriptUri}"></script>
      </body>
    </html>
  `;
}
