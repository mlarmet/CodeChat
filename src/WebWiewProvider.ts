import * as vscode from "vscode";

import { ClientEvent, WsClient } from "./socket/WsClient.js";
import { ServerEvent, WsServer } from "./socket/WsServer.js";

import logger from "utils/logger";

import { PORT, SETTINGS_KEYS } from "contants.js";

export class WebviewProvider implements vscode.WebviewViewProvider {
	private server: WsServer | null = null;
	private client: WsClient | null = null;

	private webviewView: vscode.WebviewView | null = null;

	private loginData: ILoginData | null = null;
	private messages: IMessageData[] = [];

	private unreadCount: number = 0;

	wasLogged: boolean = false;

	constructor(private readonly context: vscode.ExtensionContext) {}

	resolveWebviewView(webviewView: vscode.WebviewView) {
		this.webviewView = webviewView;

		vscode.commands.executeCommand("setContext", "CodeChat.logged", this.wasLogged);

		this.webviewView.webview.options = {
			enableScripts: true,
			localResourceRoots: [vscode.Uri.joinPath(this.context.extensionUri, "dist")],
		};

		this.webviewView.webview.html = getWebviewContent(this.webviewView.webview, this.context.extensionUri);

		this.webviewView.onDidChangeVisibility(() => {
			if (this.webviewView?.visible) {
				this.clearBadge();
				this.post("focusInput");
			}
		});

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
				case "leaveConnection":
					this.handleLogout();
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
			}
		} else if (this.client) {
			if (this.client.isConnected()) {
				this.post("peerConnected", { name: "Host" });
			}
		}

		this.restoreLastLoginData();
		this.sendLoginData();
	}

	private restoreLastLoginData(): void {
		const lastAddress = this.context.globalState.get<string>("lastAddress");
		const lastNickname = this.context.globalState.get<string>("lastNickname");
		const lastHost = this.context.globalState.get<boolean>("lastHost");

		this.loginData = { username: lastNickname ?? "", isHost: lastHost ?? false, ipClient: lastAddress ?? "" };
	}

	private sendLoginData(): void {
		const logData = { loginData: this.loginData, messages: this.messages, logged: this.wasLogged };
		this.post("receiveLogin", logData);
	}

	private async notify(from: string): Promise<void> {
		if (this.webviewView?.visible) {
			return;
		}

		this.unreadCount++;

		const plural = this.unreadCount > 1 ? "s" : "";

		// Activity bar badge
		this.webviewView!.badge = {
			value: this.unreadCount,
			tooltip: `${this.unreadCount} message${plural} non lu${plural}`,
		};

		const action = await vscode.window.showInformationMessage(`Message de ${from}`, "Ouvrir");
		if (action === "Ouvrir") {
			vscode.commands.executeCommand("CodeChat.view.focus");
		}
	}

	private clearBadge(): void {
		this.unreadCount = 0;
		this.webviewView!.badge = { value: 0, tooltip: "" };
	}

	private isNotificationActive(): boolean {
		const config = vscode.workspace.getConfiguration(APP_NAME);
		return config.get<boolean>(SETTINGS_KEYS.notification, true);
	}

	private getPort(): number {
		const config = vscode.workspace.getConfiguration(APP_NAME);
		return config.get<number>(SETTINGS_KEYS.port, PORT);
	}

	// -------------------------
	// Handlers
	// -------------------------

	private handleLogin(data: ILoginData): void {
		this.cleanup(); // Reset si on relance

		this.loginData = data;
		const { username, isHost, ipClient } = this.loginData;
		const port = this.getPort();

		this.context.globalState.update("lastAddress", ipClient);
		this.context.globalState.update("lastNickname", username);
		this.context.globalState.update("lastHost", isHost);

		logger.info(`Login: name=${username}, isHost=${isHost}${isHost ? "" : `, ip=${ipClient}`}`);

		if (isHost) {
			this.startServer(username);
		} else {
			this.connectClient(username, ipClient, port);
		}

		this.wasLogged = true;
		vscode.commands.executeCommand("setContext", "CodeChat.logged", this.wasLogged);
		this.sendLoginData();
	}

	handleLogout(): void {
		this.cleanup();
		this.post("logout");
		this.wasLogged = false;
		vscode.commands.executeCommand("setContext", "CodeChat.logged", this.wasLogged);
	}

	handleClearMessages(): void {
		this.messages = [];
		this.post("clearMessages");
	}

	private handleSendMessage(data: IMessageData): void {
		try {
			if (this.server) {
				this.server.send(data);
			} else if (this.client) {
				this.client.send(data);
			}

			this.post("pushMessage", data); // send back to sender
			this.messages.push(data);
		} catch (err) {
			const message = err instanceof Error ? err.message : "Erreur envoi message";
			vscode.window.showErrorMessage(message);
			logger.error(`Send error: ${message}`);
		}
	}

	private handlePeerEvent = (event: ServerEvent | ClientEvent): void => {
		switch (event.type) {
			case "reconnecting":
				logger.info("Reconnecting...");
				break;
			case "connected":
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
				this.post(this.server?.isClientConnected() ? "peerConnected" : "peerDisconnected", { name: event.name });
				break;
			case "message":
				logger.info(`Message from ${event.data.author}: ${event.data.text}`);
				this.post("pushMessage", event.data);
				this.messages.push(event.data);

				if (this.isNotificationActive()) {
					this.notify(event.data.author);
				}
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

		const port = this.getPort();

		try {
			this.server.start(port);
			logger.info(`WS server started on port ${port}`);
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

	private connectClient(clientName: string, ip: string, port: number): void {
		this.client = new WsClient(clientName, ip, port, this.handlePeerEvent);

		this.client.connect(ip, port);
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
