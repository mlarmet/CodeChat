declare const APP_NAME: string;

declare module "*.css";

interface IMessageData {
	text: string;
	author: string;
	datetime: Date;
}

interface IMessageEvent {
	command:
		| "webviewReady"
		| "leaveConnection"
		| "logout"
		| "sendMessage"
		| "pushMessage"
		| "clearMessages"
		| "sendLogin"
		| "receiveLogin"
		| "peerConnected"
		| "peerDisconnected"
		| "error"
		| "focusInput";
	data: unknown;
}

interface ILoginData {
	username: string;
	ipClient: string;
	isHost: boolean;
}
