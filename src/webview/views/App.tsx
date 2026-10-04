import { useEffect } from "react";

import vscode from "utils/vscode";

import { useAppstore } from "store/app.store";
import { useLoginStore } from "store/login.store";
import { useMessageStore } from "store/message.store";

import About from "@/components/About/About";
import Chat from "@/components/Chat/Chat";
import Login from "@/components/Login/Login";
import MessageFeed from "@/components/Message/Message";

import { useModal } from "@/components/Modal/ModalProvider";

import "./App.css";

const App: React.FC = () => {
	const { storeMessage, storeAllMessage } = useMessageStore();
	const { setLoginData, setList } = useLoginStore();
	const { setShowAboutModal, setDisplayEvents, showAboutModal, setLogged, logged } = useAppstore();

	const { open } = useModal();

	useEffect(() => {
		// On open webview, ask for last form data
		vscode.postMessage({ command: "webviewReady", data: null });
	}, []);

	useEffect(() => {
		const handler = async (event: MessageEvent) => {
			const payload: IMessageEvent = event.data;
			const command = payload.command;
			const data: any = payload.data;

			switch (command) {
				case "pushMessage":
					storeMessage(data as MessageData);
					break;
				case "pushList": {
					const list = data as IListPayload;
					setList(list.peers, list.remoteConnected);
					break;
				}
				case "clearMessages":
					storeAllMessage([]);
					break;
				case "showAbout":
					if (showAboutModal) return;
					setShowAboutModal(true);
					open(<About />, { title: "À propos", onDismiss: () => setShowAboutModal(false) });
					break;
				case "toggleEvents":
					const value = data.isVisible as boolean;
					setDisplayEvents(value);
					break;
				case "receiveLogin": {
					const session = data as ISessionPayload;
					setLoginData(session.loginData);
					storeAllMessage(session.messages);
					setLogged(session.logged);
					setList(session.peers, session.remoteConnected);
					break;
				}
				case "logout":
					setLogged(false);
					setList([], false);
					storeAllMessage([]);
					break;
				case "focusInput":
					document.getElementById(logged ? "message" : "username")?.focus();
					break;
				default:
					break;
			}
		};

		window.addEventListener("message", handler);
		return () => window.removeEventListener("message", handler);
	}, [logged, setLoginData, setList, storeAllMessage, storeMessage]);

	return (
		<main>
			{logged ? (
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
