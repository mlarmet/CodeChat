// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";

import logger from "./utils/logger.js";
import { WebviewProvider } from "./webview/WebWiewProvider.js";

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	// This lines of code will only be executed once when your extension is activated
	logger.info(`${APP_NAME} extension is now active!`);

	const provider = new WebviewProvider(context.extensionUri);

	context.subscriptions.push(vscode.window.registerWebviewViewProvider(`${APP_NAME}.view`, provider));
}

// This method is called when your extension is deactivated
export function deactivate() {}
