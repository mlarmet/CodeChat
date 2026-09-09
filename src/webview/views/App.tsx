import { useEffect } from "react";

import vscode from "utils/vscode";

import { useLoginStore } from "store/login.store";
import { useMessageStore } from "store/message.store";

import Chat from "@/components/Chat/Chat";
import Login from "@/components/Login/Login";
import MessageFeed from "@/components/Message/Message";

import "./App.css";

const App: React.FC = () => {
	const storeMessage = useMessageStore((state) => state.storeMessage);

	const { isLogged, setIsLogged, setUsername } = useLoginStore();

	useEffect(() => {
		const handler = (event: MessageEvent) => {
			const payload: IMessageEvent = event.data;
			const command = payload.command;
			const data: any = payload.data;

			switch (command) {
				case "pushMessage":
					storeMessage(data as IMessageData);
					break;
				case "receiveLogin":
					setUsername(data.username);
					setIsLogged(true);
					break;
				default:
					break;
			}
		};

		// On reopen webview, ask if user is logged
		vscode.postMessage({ command: "webviewReady", data: null });

		window.addEventListener("message", handler);
		return () => window.removeEventListener("message", handler);
	}, []);

	return (
		<main>
			{isLogged ? (
				<>
					<MessageFeed />
					<Chat />
				</>
			) : (
				<Login />
			)}
		</main>
	);
};

export default App;
