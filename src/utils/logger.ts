import * as vscode from "vscode";

const outputChannel = vscode.window.createOutputChannel("CodeChat");
outputChannel.show(true);

function formatDate(date: Date) {
	const pad = (n: number) => n.toString().padStart(2, "0");

	const yyyy = date.getFullYear();
	const mm = pad(date.getMonth() + 1);
	const dd = pad(date.getDate());
	const hh = pad(date.getHours());
	const min = pad(date.getMinutes());
	const sec = pad(date.getSeconds());

	return `${yyyy}-${mm}-${dd} ${hh}:${min}:${sec}`;
}

const getDate = () => {
	const date = new Date();
	return formatDate(date);
};

const logger = {
	debug: (msg: string) => outputChannel.appendLine(`${getDate()} - [DEBUG] : ${msg}`),
	info: (msg: string) => outputChannel.appendLine(`${getDate()} - [INFO]  : ${msg}`),
	warn: (msg: string) => outputChannel.appendLine(`${getDate()} - [WARN]  : ${msg}`),
	error: (msg: string) => outputChannel.appendLine(`${getDate()} - [ERROR] : ${msg}`),
};

export default logger;
