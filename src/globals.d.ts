declare const APP_NAME: string;

declare module "*.css";

type PresenceEvent = "join" | "leave";
type PeerStatus = "online" | "offline" | "busy";

interface PeerInfo {
	id: string;
	name: string;
	isHost: boolean;
	status: PeerStatus;
}

type MessageBase = {
	authorId?: string;
	authorName: string;
	datetime: string;
};

type MessageData =
	| (MessageBase & {
			text: string;
			type: "message";
	  })
	| (MessageBase & {
			type: "presence";
			event: PresenceEvent;
			isHost: boolean;
	  });

interface IListPayload {
	peers: PeerInfo[];
	remoteConnected: boolean;
}

interface ISessionPayload extends IListPayload {
	loginData: ILoginData | null;
	messages: MessageData[];
	logged: boolean;
}

interface IMessageEvent {
	command:
		| "webviewReady"
		| "leaveConnection"
		| "logout"
		| "sendMessage"
		| "pushMessage"
		| "pushList"
		| "clearMessages"
		| "sendLogin"
		| "receiveLogin"
		| "showAbout"
		| "error"
		| "toggleEvents"
		| "focusInput";
	data: unknown;
}

interface ILoginData {
	id?: string;
	username: string;
	ipClient: string;
	port: number;
	isHost: boolean;
}

type SocketEvent = { type: "message"; data: MessageData } | { type: "list"; peers: PeerInfo[]; remoteConnected: boolean } | { type: "error"; message: string };

type WireMessage =
	| { kind: "hello"; name: string; clientId: string }
	| { kind: "welcome"; self: PeerInfo; peers: PeerInfo[] }
	| { kind: "chat"; data: Extract<MessageData, { type: "message" }> }
	| { kind: "presence"; event: PresenceEvent; peer: PeerInfo; datetime: string }
	| { kind: "list"; peers: PeerInfo[] };
