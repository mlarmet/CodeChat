import { WebSocket } from "ws";

import { PORT } from "../constante.js";

export type ClientEvent =
	| { type: "connected" }
	| { type: "reconnecting" }
	| { type: "disconnected" }
	| { type: "message"; data: IMessageData }
	| { type: "error"; message: string };

type WireMessage = { kind: "handshake"; name: string } | { kind: "chat"; data: IMessageData };

export class WsClient {
	private ws: WebSocket | null = null;

	private ip: string;
	private clientName: string;

	private reconnectTimer: NodeJS.Timeout | null = null;
	private shouldReconnect: boolean = true;
	private reconnectDelay: number = 3000;

	private onEvent: (event: ClientEvent) => void;

	constructor(clientName: string, ip: string, onEvent: (event: ClientEvent) => void) {
		this.clientName = clientName;
		this.ip = ip;

		this.onEvent = onEvent;
	}

	private scheduleReconnect(): void {
		this.reconnectTimer = setTimeout(() => {
			this.onEvent({ type: "reconnecting" });
			this.connect(this.ip, PORT);
			// backoff exponentiel plafonné à 30s
			this.reconnectDelay = Math.min(this.reconnectDelay * 2, 30_000);
		}, this.reconnectDelay);
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

		this.ws.on("close", (code) => {
			this.ws = null;
			this.onEvent({ type: "disconnected" });

			// 1000 = fermeture normale (disconnect() appelé volontairement)
			if (this.shouldReconnect && code !== 1000) {
				this.scheduleReconnect();
			}
		});

		this.ws.on("error", (err) => {
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
		this.shouldReconnect = false;
		if (this.reconnectTimer) {
			clearTimeout(this.reconnectTimer);
			this.reconnectTimer = null;
		}
		this.ws?.close(1000); // code 1000 = volontaire
		this.ws = null;
	}
}
