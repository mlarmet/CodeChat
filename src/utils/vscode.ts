// acquireVsCodeApi est injecté globalement par VSCode dans la webview
declare function acquireVsCodeApi<T = unknown>(): {
	postMessage(message: IMessageEvent): void;
	getState(): T | undefined;
	setState(state: T): void;
};

const vscode = acquireVsCodeApi();

export default vscode;
