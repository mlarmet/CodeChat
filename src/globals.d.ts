declare const APP_NAME: string;

interface IMessageData {
	text: string;
	author: string;
	datetime: Date;
}

interface IMessageEvent {
	command: "webviewReady" | "sendMessage" | "pushMessage" | "sendLogin" | "receiveLogin" | "error";
	data: unknown;
}

interface ILoginData {
	username: string;
	ipClient: string;
	isHost: boolean;
}
