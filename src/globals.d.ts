declare const APP_NAME: string;

declare module "*.css";

type PresenceEvent = "join" | "leave";
type PeerStatus = "online" | "offline";

interface PeerInfo {
	id: string;
	name: string;
	isHost: boolean;
	status: PeerStatus;
}

type MessageData =
	| {
			text: string;
			author: string;
			datetime: string;
			type: "message";
	  }
	| {
			author: string;
			datetime: string;
			type: "presence";
			event: PresenceEvent;
			isHost: boolean;
	  };

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
		| "error"
		| "toggleEvents"
		| "focusInput";
	data: unknown;
}

interface ILoginData {
	username: string;
	ipClient: string;
	isHost: boolean;
}

type SocketEvent = { type: "message"; data: MessageData } | { type: "list"; peers: PeerInfo[]; remoteConnected: boolean } | { type: "error"; message: string };

type WireMessage =
	| { kind: "hello"; name: string; clientId: string }
	| { kind: "welcome"; self: PeerInfo; peers: PeerInfo[] }
	| { kind: "chat"; data: Extract<MessageData, { type: "message" }> }
	| { kind: "presence"; event: PresenceEvent; peer: PeerInfo; datetime: string }
	| { kind: "list"; peers: PeerInfo[] };
