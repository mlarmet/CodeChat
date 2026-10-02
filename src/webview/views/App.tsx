import { useEffect, useState } from "react";

import vscode from "utils/vscode";

import { useLoginStore } from "store/login.store";
import { useMessageStore } from "store/message.store";

import Actions from "@/components/Actions/Actions";
import Chat from "@/components/Chat/Chat";
import Login from "@/components/Login/Login";
import MessageFeed from "@/components/Message/Message";

import "./App.css";

const App: React.FC = () => {
	const [logged, setLogged] = useState(false);

	const { storeMessage, storeAllMessage, messages } = useMessageStore();
	const { setLoginData, setRemoteConnected } = useLoginStore();

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
					setLoginData(data.loginData as ILoginData);
					storeAllMessage(data.messages as IMessageData[]);

					setLogged(data.logged);
					break;
				case "peerConnected":
					setRemoteConnected(true);
					break;
				case "peerDisconnected":
					setRemoteConnected(false);
					break;
				case "logout":
					setLogged(false);
					setRemoteConnected(false);
					storeAllMessage([]);
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
			{logged ? (
				<>
					<Actions />
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
