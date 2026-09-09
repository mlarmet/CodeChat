import logger from "utils/logger";
import { WebSocket } from "ws";

export type ClientEvent = { type: "connected" } | { type: "disconnected" } | { type: "message"; data: IMessageData } | { type: "error"; message: string };

type WireMessage = { kind: "handshake"; name: string } | { kind: "chat"; data: IMessageData };

export class WsClient {
	private ws: WebSocket | null = null;
	private clientName: string;
	private hostName = "Host"; // sera connu si on ajoute handshake retour plus tard
	private onEvent: (event: ClientEvent) => void;

	constructor(clientName: string, onEvent: (event: ClientEvent) => void) {
		this.clientName = clientName;
		this.onEvent = onEvent;
	}

	connect(ip: string, port: number): void {
		if (this.ws) {
			throw new Error("Already connected");
		}

		const url = `ws://${ip}:${port}`;
		this.ws = new WebSocket(url);

		this.ws.on("open", () => {
			// Envoyer le handshake avec notre nom
			const handshake: WireMessage = { kind: "handshake", name: this.clientName };
			this.ws!.send(JSON.stringify(handshake));
			this.onEvent({ type: "connected" });
		});

		this.ws.on("message", (raw) => {
			let msg: WireMessage;

			try {
				msg = JSON.parse(raw.toString()) as WireMessage;
			} catch {
				return;
			}

			if (msg.kind === "chat") {
				this.onEvent({ type: "message", data: msg.data });
			}
		});

		this.ws.on("close", () => {
			this.ws = null;
			this.onEvent({ type: "disconnected" });
		});

		this.ws.on("error", (err) => {
			logger.error(`WsClient error: ${err}`);
			this.onEvent({ type: "error", message: err.message });
		});
	}

	send(data: IMessageData): void {
		if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
			throw new Error("Not connected");
		}

		const msg: WireMessage = { kind: "chat", data };
		this.ws.send(JSON.stringify(msg));
	}

	isConnected(): boolean {
		return !!this.ws && this.ws.readyState === WebSocket.OPEN;
	}

	disconnect(): void {
		this.ws?.close();
		this.ws = null;
	}
}
