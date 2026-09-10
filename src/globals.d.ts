declare const APP_NAME: string;

declare module "*.css";

interface IMessageData {
	text: string;
	author: string;
	datetime: Date;
}

interface IMessageEvent {
	command: "webviewReady" | "sendMessage" | "pushMessage" | "sendLogin" | "receiveLogin" | "peerConnected" | "peerDisconnected" | "error";
	data: unknown;
}

interface ILoginData {
	username: string;
	ipClient: string;
	isHost: boolean;
}
