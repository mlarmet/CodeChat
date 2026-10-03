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
	private clients = new Map<WebSocket, ConnectedClient>();
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
			let clientName = "Unknown";
			let isRegistered = false;

			ws.on("message", (raw) => {
				let msg: WireMessage;

				try {
					msg = JSON.parse(raw.toString()) as WireMessage;
				} catch {
					return;
				}

				if (msg.kind === "handshake") {
					if (isRegistered) {
						return;
					}

					clientName = msg.name;
					isRegistered = true;
					this.clients.set(ws, { ws, name: clientName });
					this.onEvent({ type: "client_connected", name: clientName });
					return;
				}

				if (msg.kind === "chat" && isRegistered) {
					this.broadcast(msg.data, ws);
					this.onEvent({ type: "message", data: msg.data });
				}
			});

			ws.on("close", () => {
				if (isRegistered) {
					this.clients.delete(ws);
					this.onEvent({ type: "client_disconnected", name: clientName });
				}
			});

			ws.on("error", (err) => {
				this.onEvent({ type: "error", message: err.message });
			});
		});

		this.wss.on("error", (err) => {
			this.onEvent({ type: "error", message: err.message });
		});
	}

	/** Diffuse un message de l'host à tous les clients connectés. */
	send(data: IMessageData): void {
		if (this.broadcast(data) === 0) {
			throw new Error("No client connected");
		}
	}

	/** Nom de l'host (utile pour l'affichage côté panel) */
	getHostName(): string {
		return this.hostName;
	}

	isClientConnected(): boolean {
		return this.clients.size > 0;
	}

	getClientName(): string | null {
		return this.clients.values().next().value?.name ?? null;
	}

	stop(): void {
		for (const { ws } of this.clients.values()) {
			ws.close();
		}
		this.clients.clear();
		this.wss?.close();
		this.wss = null;
	}

	private broadcast(data: IMessageData, excludedClient?: WebSocket): number {
		const message: WireMessage = { kind: "chat", data };
		const raw = JSON.stringify(message);
		let recipientCount = 0;

		for (const ws of this.clients.keys()) {
			if (ws === excludedClient || ws.readyState !== WebSocket.OPEN) {
				continue;
			}

			ws.send(raw);
			recipientCount++;
		}

		return recipientCount;
	}
}
