// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";

import logger from "utils/logger.js";
import { WebviewProvider } from "./WebWiewProvider.js";

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {
	// This lines of code will only be executed once when your extension is activated
	logger.info(`${APP_NAME} extension is now active!`);

	const provider = new WebviewProvider(context);

	const visible = context.globalState.get<boolean>("lastEvents", true);
	await vscode.commands.executeCommand("setContext", "CodeChat.eventsVisible", visible);

	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(`${APP_NAME}.view`, provider, {
			webviewOptions: { retainContextWhenHidden: true },
		}),

		vscode.commands.registerCommand(`${APP_NAME}.clearMessages`, async () => {
			if (provider.logged === false) {
				vscode.window.showInformationMessage("Vous devez être connecté pour effectuer cette action.");
				return;
			}

			const confirm = await vscode.window.showWarningMessage(
				"Voulez-vous supprimer tous les messages ?",
				{
					modal: true,
					detail: "Les messages seront supprimés uniquement pour vous.",
				},
				"Supprimer",
			);

			if (confirm === "Supprimer") {
				provider.handleClearMessages();
			}
		}),

		vscode.commands.registerCommand(`${APP_NAME}.logout`, async () => {
			if (provider.logged === false) {
				vscode.window.showInformationMessage("Vous devez être connecté pour effectuer cette action.");
				return;
			}

			const confirm = await vscode.window.showWarningMessage(
				"Voulez-vous vraiment quitter la conversation ?",
				{ modal: true, detail: "Tous les messages seront supprimés." },
				"Quitter",
			);

			if (confirm === "Quitter") {
				provider.handleLogout();
			}
		}),

		vscode.commands.registerCommand(`${APP_NAME}.hideConnectionEvents`, () => provider.handleHideEvents(false)),
		vscode.commands.registerCommand(`${APP_NAME}.showConnectionEvents`, () => provider.handleHideEvents(true)),
	);
}

// This method is called when your extension is deactivated
export function deactivate() {}
