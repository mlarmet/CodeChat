import logger from "utils/logger";
import { WebSocket } from "ws";

import { createPeer, createPeerId, HOST_PEER_ID, parseWire, presenceMessage } from "./protocol.js";

const INITIAL_RECONNECT_DELAY = 3_000;
const MAX_RECONNECT_DELAY = 30_000;

export class WsClient {
	private ws: WebSocket | null = null;
	private reconnectTimer: NodeJS.Timeout | null = null;
	private reconnectDelay = INITIAL_RECONNECT_DELAY;
	private shouldReconnect = true;
	private sessionEstablished = false;
	private hostLeaveAnnounced = false;
	private hostPeer: PeerInfo = createPeer(HOST_PEER_ID, "Host", true, "offline");
	private lastPeers: PeerInfo[];

	private readonly clientId = createPeerId();
	private readonly onEvent: (event: SocketEvent) => void;

	constructor(
		private readonly clientName: string,
		private readonly ip: string,
		private readonly port: number,
		onEvent: (event: SocketEvent) => void,
	) {
		this.onEvent = onEvent;
		this.lastPeers = [this.hostPeer, createPeer(this.clientId, clientName, false, "online")];
	}

	connect(): void {
		if (!this.shouldReconnect) {
			return;
		}

		if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
			return;
		}

		const socket = new WebSocket(`ws://${this.ip}:${this.port}`);
		this.ws = socket;

		socket.on("open", () => {
			if (this.ws !== socket) {
				return;
			}

			socket.send(JSON.stringify({ kind: "hello", name: this.clientName, clientId: this.clientId }));
		});

		socket.on("message", (raw) => {
			if (this.ws !== socket) {
				return;
			}

			const msg = parseWire(raw.toString());
			if (!msg) {
				return;
			}

			switch (msg.kind) {
				case "welcome":
				case "list":
					this.applyList(msg.peers, msg.kind === "welcome");
					break;
				case "presence":
					this.onEvent({ type: "message", data: presenceMessage(msg.peer, msg.event, msg.datetime) });
					break;
				case "chat":
					this.onEvent({ type: "message", data: msg.data });
					break;
			}
		});

		socket.on("close", (code) => {
			if (this.ws !== socket) {
				return;
			}

			this.ws = null;
			logger.info(`Connection closed with code ${code}`);
			this.setHostStatus("offline");
			this.emitList(false);

			if (!this.shouldReconnect) {
				return;
			}

			if (this.sessionEstablished && !this.hostLeaveAnnounced) {
				this.onEvent({ type: "message", data: presenceMessage(this.hostPeer, "leave") });
				this.hostLeaveAnnounced = true;
			}

			this.scheduleReconnect();
		});

		socket.on("error", (err) => {
			if (this.ws === socket) {
				logger.warn(`WS client error: ${err.message}`);
			}
		});
	}

	send(data: Extract<MessageData, { type: "message" }>): void {
		if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
			throw new Error("Not connected");
		}

		this.ws.send(JSON.stringify({ kind: "chat", data }));
	}

	disconnect(): void {
		this.shouldReconnect = false;
		this.clearReconnectTimer();
		this.ws?.close(1000);
		this.ws = null;
	}

	private applyList(peers: PeerInfo[], fromWelcome: boolean): void {
		this.lastPeers = peers;
		this.hostPeer = peers.find((peer) => peer.isHost) ?? this.hostPeer;
		this.emitList(true);

		if (!fromWelcome) {
			return;
		}

		this.sessionEstablished = true;
		this.reconnectDelay = INITIAL_RECONNECT_DELAY;

		if (this.hostLeaveAnnounced) {
			this.onEvent({ type: "message", data: presenceMessage({ ...this.hostPeer, status: "online" }, "join") });
			this.hostLeaveAnnounced = false;
		}
	}

	private setHostStatus(status: PeerStatus): void {
		this.hostPeer = { ...this.hostPeer, status };
		this.lastPeers = this.lastPeers.map((peer) => (peer.isHost ? this.hostPeer : peer));
	}

	private emitList(remoteConnected: boolean): void {
		const peers = remoteConnected
			? this.lastPeers
			: this.lastPeers.map((peer) => (peer.id === this.clientId ? peer : { ...peer, status: "offline" as const }));

		this.onEvent({ type: "list", peers, remoteConnected });
	}

	private scheduleReconnect(): void {
		this.clearReconnectTimer();
		this.reconnectTimer = setTimeout(() => {
			logger.info("Reconnecting...");
			this.connect();
			this.reconnectDelay = Math.min(this.reconnectDelay * 2, MAX_RECONNECT_DELAY);
		}, this.reconnectDelay);
	}

	private clearReconnectTimer(): void {
		if (this.reconnectTimer) {
			clearTimeout(this.reconnectTimer);
			this.reconnectTimer = null;
		}
	}
}
