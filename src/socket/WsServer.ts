import { IncomingMessage } from "http";
import { WebSocket, WebSocketServer } from "ws";

import { createPeer, hasOnlineGuest, HOST_PEER_ID, parseWire, presenceMessage } from "./protocol.js";

export class WsServer {
	private wss: WebSocketServer | null = null;
	private readonly peers = new Map<string, PeerInfo>();
	private readonly sockets = new Map<string, WebSocket>();
	private readonly onEvent: (event: SocketEvent) => void;

	constructor(hostName: string, onEvent: (event: SocketEvent) => void) {
		this.peers.set(HOST_PEER_ID, createPeer(HOST_PEER_ID, hostName, true, "online"));
		this.onEvent = onEvent;
	}

	start(port: number): void {
		if (this.wss) {
			throw new Error("Server already running");
		}

		this.wss = new WebSocketServer({ host: "0.0.0.0", port });
		this.notifyList();

		this.wss.on("connection", (ws: WebSocket, _req: IncomingMessage) => {
			this.bindSocket(ws);
		});

		this.wss.on("error", (err) => {
			this.onEvent({ type: "error", message: err.message });
		});
	}

	send(data: Extract<MessageData, { type: "message" }>): void {
		if (!hasOnlineGuest(this.list())) {
			throw new Error("No client connected");
		}

		this.broadcast({ kind: "chat", data });
	}

	stop(): void {
		for (const ws of this.sockets.values()) {
			ws.close(1001, "Host left");
		}
		this.sockets.clear();
		this.wss?.close();
		this.wss = null;
	}

	private list(): PeerInfo[] {
		return [...this.peers.values()];
	}

	private bindSocket(ws: WebSocket): void {
		let peerId: string | null = null;

		ws.on("message", (raw) => {
			const msg = parseWire(raw.toString());
			if (!msg) {
				return;
			}

			if (msg.kind === "hello") {
				if (!peerId) {
					peerId = this.registerClient(ws, msg.clientId, msg.name);
				}
				return;
			}

			if (peerId && msg.kind === "chat") {
				this.broadcast({ kind: "chat", data: msg.data }, peerId);
				this.onEvent({ type: "message", data: msg.data });
			}
		});

		ws.on("close", () => {
			if (peerId && this.sockets.get(peerId) === ws) {
				this.unregisterClient(peerId);
			}
		});

		ws.on("error", (err) => {
			this.onEvent({ type: "error", message: err.message });
		});
	}

	private registerClient(ws: WebSocket, clientId: string, name: string): string {
		const previousSocket = this.sockets.get(clientId);
		const alreadyOnline = previousSocket || this.peers.get(clientId)?.status === "online";

		if (previousSocket && previousSocket !== ws) {
			previousSocket.close(4000, "Replaced by new connection");
		}

		const peer = createPeer(clientId, name, false, "online");
		this.peers.set(clientId, peer);
		this.sockets.set(clientId, ws);

		this.sendTo(ws, { kind: "welcome", self: peer, peers: this.list() });

		if (!alreadyOnline) {
			const datetime = new Date().toISOString();
			this.broadcast({ kind: "presence", event: "join", peer, datetime }, clientId);
			this.onEvent({ type: "message", data: presenceMessage(peer, "join", datetime) });
		}

		this.notifyList();
		return clientId;
	}

	private unregisterClient(peerId: string): void {
		const peer = this.peers.get(peerId);
		if (!peer) {
			return;
		}

		this.sockets.delete(peerId);
		const offlinePeer: PeerInfo = { ...peer, status: "offline" };
		this.peers.delete(peerId);

		const datetime = new Date().toISOString();
		this.broadcast({ kind: "presence", event: "leave", peer: offlinePeer, datetime });
		this.onEvent({ type: "message", data: presenceMessage(offlinePeer, "leave", datetime) });
		this.notifyList();
	}

	private notifyList(): void {
		const peers = this.list();
		this.broadcast({ kind: "list", peers });
		this.onEvent({ type: "list", peers, remoteConnected: hasOnlineGuest(peers) });
	}

	private broadcast(message: WireMessage, excludedPeerId?: string): void {
		const raw = JSON.stringify(message);

		for (const [id, ws] of this.sockets) {
			if (id !== excludedPeerId && ws.readyState === WebSocket.OPEN) {
				ws.send(raw);
			}
		}
	}

	private sendTo(ws: WebSocket, message: WireMessage): void {
		if (ws.readyState === WebSocket.OPEN) {
			ws.send(JSON.stringify(message));
		}
	}
}
