export const HOST_PEER_ID = "host";

export function createPeerId(): string {
	return crypto.randomUUID();
}

export function createPeer(id: string, name: string, isHost: boolean, status: PeerStatus = "online"): PeerInfo {
	return { id, name, isHost, status };
}

export function parseWire(raw: string): WireMessage | null {
	try {
		const msg = JSON.parse(raw) as WireMessage;
		if (!msg || typeof msg !== "object" || !("kind" in msg)) {
			return null;
		}
		return msg;
	} catch {
		return null;
	}
}

export function presenceMessage(peer: PeerInfo, event: PresenceEvent, datetime?: string): MessageData {
	return {
		type: "presence",
		authorId: peer.id,
		authorName: peer.name,
		datetime: datetime ?? new Date().toISOString(),
		event,
		isHost: peer.isHost,
	};
}

export function isChatMessage(data: MessageData): data is Extract<MessageData, { type: "message" }> {
	return data.type === "message";
}

export function hasOnlineGuest(peers: PeerInfo[]): boolean {
	return peers.some((peer) => !peer.isHost && peer.status === "online");
}
