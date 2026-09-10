import * as vscode from "vscode";

import { ClientEvent, WsClient } from "./socket/WsClient.js";
import { ServerEvent, WsServer } from "./socket/WsServer.js";

import logger from "utils/logger";

const PORT = 12121;

export class WebviewProvider implements vscode.WebviewViewProvider {
	private server: WsServer | null = null;
	private client: WsClient | null = null;
	private webviewView: vscode.WebviewView | null = null;

	private loginData: ILoginData | null = null;
	private messages: IMessageData[] = [];

	constructor(private readonly extensionUri: vscode.Uri) {}

	resolveWebviewView(webviewView: vscode.WebviewView) {
		this.webviewView = webviewView;

		this.webviewView.webview.options = {
			enableScripts: true,
			localResourceRoots: [vscode.Uri.joinPath(this.extensionUri, "dist")],
		};

		this.webviewView.webview.html = getWebviewContent(this.webviewView.webview, this.extensionUri);

		// Messages depuis React
		this.webviewView.webview.onDidReceiveMessage(({ command, data }: IMessageEvent) => {
			logger.info(`Message from view: ${JSON.stringify({ command, data })}`);

			switch (command) {
				case "webviewReady":
					this.restoreState();
					break;
				case "sendMessage":
					this.handleSendMessage(data as IMessageData);
					break;
				case "sendLogin":
					this.handleLogin(data as ILoginData);
					break;
				case "error":
					vscode.window.showErrorMessage((data as string) || "Une erreur est survenue.");
					logger.error(`Error: ${JSON.stringify(data || "")}`);
					break;
				default:
					logger.error(`Unknown command: ${command}`);
					break;
			}
		});
	}

	private restoreState(): void {
		if (this.server) {
			if (this.server.isClientConnected()) {
				this.post("peerConnected", { name: this.server.getClientName() });
				this.sendLoginData();
			}
		} else if (this.client?.isConnected()) {
			this.post("peerConnected", { name: "Host" });
			this.sendLoginData();
		}
	}

	private sendLoginData(): void {
		const logData = { loginData: this.loginData, messages: this.messages };
		this.post("receiveLogin", logData);
	}

	// -------------------------
	// Handlers
	// -------------------------

	private handleLogin(data: ILoginData): void {
		this.cleanup(); // Reset si on relance

		this.loginData = data;
		const { username, isHost, ipClient } = this.loginData;

		logger.info(`Login: name=${username}, isHost=${isHost}${isHost ? "" : `, ip=${ipClient}`}`);

		if (isHost) {
			this.startServer(username);
		} else {
			this.connectClient(username, ipClient);
		}

		this.sendLoginData();
	}

	private handleSendMessage(data: IMessageData): void {
		try {
			if (this.server) {
				this.server.send(data);
			} else if (this.client) {
				this.client.send(data);
			}

			this.post("pushMessage", data); // send back to sender
		} catch (err) {
			const message = err instanceof Error ? err.message : "Erreur envoi message";
			vscode.window.showErrorMessage(message);
			logger.error(`Send error: ${message}`);
		}
	}

	private handlePeerEvent = (event: ServerEvent | ClientEvent): void => {
		switch (event.type) {
			case "connected":
				this.post("receiveLogin", { isHost: false });
				this.post("peerConnected", { name: "Host" });
				break;
			case "disconnected":
				this.post("peerDisconnected", { name: "Host" });
				break;
			case "client_connected":
				this.post("peerConnected", { name: event.name });
				break;
			case "client_disconnected":
				logger.info(`Client disconnected: ${event.name}`);
				this.post("peerDisconnected", { name: event.name });
				break;
			case "message":
				logger.info(`Message from ${event.data.author}: ${event.data.text}`);
				this.post("pushMessage", event.data);
				this.messages.push(event.data);
				break;
			case "error":
				logger.error(`Error: ${event.message}`);
				this.post("error", { message: event.message });
				break;
			default:
				logger.error(`Unknown event: ${JSON.stringify(event)}`);
				break;
		}
	};

	// -------------------------
	// WsServer (host)
	// -------------------------

	private startServer(hostName: string): void {
		this.server = new WsServer(hostName, this.handlePeerEvent);

		try {
			this.server.start(PORT);
			logger.info(`WS server started on port ${PORT}`);
		} catch (err) {
			const message = err instanceof Error ? err.message : "Impossible de démarrer le serveur";
			vscode.window.showErrorMessage(message);
			logger.error(`Server start error: ${message}`);
			this.server = null;
		}
	}

	// -------------------------
	// WsClient (peer)
	// -------------------------

	private connectClient(clientName: string, ip: string): void {
		this.client = new WsClient(clientName, ip, this.handlePeerEvent);

		this.client.connect(ip, PORT);
	}

	// -------------------------
	// Utilitaires
	// -------------------------

	private post(command: IMessageEvent["command"], data?: unknown): void {
		this.webviewView?.webview.postMessage({ command, data });
	}

	private cleanup(): void {
		this.server?.stop();
		this.server = null;
		this.client?.disconnect();
		this.client = null;
		this.loginData = null;
		this.messages = [];
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
