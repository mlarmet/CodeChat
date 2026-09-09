import { IncomingMessage } from "http";
import { WebSocket, WebSocketServer } from "ws";

export type ServerEvent =
	| { type: "client_connected"; name: string }
	| { type: "client_disconnected"; name: string }
	| { type: "message"; data: IMessageData }
	| { type: "error"; message: string };

// Payload échangés sur le wire
type WireMessage = { kind: "handshake"; name: string } | { kind: "chat"; data: IMessageData };

interface ConnectedClient {
	ws: WebSocket;
	name: string;
}

export class WsServer {
	private wss: WebSocketServer | null = null;
	private client: ConnectedClient | null = null; // 1 seul client attendu
	private hostName: string;
	private onEvent: (event: ServerEvent) => void;

	constructor(hostName: string, onEvent: (event: ServerEvent) => void) {
		this.hostName = hostName;
		this.onEvent = onEvent;
	}

	start(port: number): void {
		if (this.wss) {
			throw new Error("Server already running");
		}

		this.wss = new WebSocketServer({ port });

		this.wss.on("connection", (ws: WebSocket, _req: IncomingMessage) => {
			// On refuse une deuxième connexion
			if (this.client) {
				ws.close(1008, "Already connected");
				return;
			}

			let clientName = "Unknown";

			ws.on("message", (raw) => {
				let msg: WireMessage;

				try {
					msg = JSON.parse(raw.toString()) as WireMessage;
				} catch {
					return;
				}

				if (msg.kind === "handshake") {
					clientName = msg.name;
					this.client = { ws, name: clientName };
					this.onEvent({ type: "client_connected", name: clientName });
					return;
				}

				if (msg.kind === "chat") {
					this.onEvent({ type: "message", data: msg.data });
				}
			});

			ws.on("close", () => {
				this.client = null;
				this.onEvent({ type: "client_disconnected", name: clientName });
			});

			ws.on("error", (err) => {
				this.onEvent({ type: "error", message: err.message });
			});
		});

		this.wss.on("error", (err) => {
			this.onEvent({ type: "error", message: err.message });
		});
	}

	/** Envoyer un message de l'host vers le client connecté */
	send(data: IMessageData): void {
		if (!this.client) {
			throw new Error("No client connected");
		}

		const msg: WireMessage = { kind: "chat", data };
		this.client.ws.send(JSON.stringify(msg));
	}

	/** Nom de l'host (utile pour l'affichage côté panel) */
	getHostName(): string {
		return this.hostName;
	}

	isClientConnected(): boolean {
		return this.client !== null;
	}

	getClientName(): string | null {
		return this.client?.name ?? null;
	}

	stop(): void {
		this.client?.ws.close();
		this.client = null;
		this.wss?.close();
		this.wss = null;
	}
}
