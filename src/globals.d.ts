declare const APP_NAME: string;

interface IMessage {
	text: string;
	author: string;
	datetime: Date;
}

interface IMessageEvent {
	command: "sendMessage" | "postMessage" | "error";
	data: unknown;
}
