import { useEffect, useState } from "react";

import { useMessageStore } from "store/message.store";
import { useLoginStore } from "store/login.store";

import Chat from "@/components/Chat/Chat";
import MessageFeed from "@/components/Message/Message";
import Login from "@/components/Login/Login";

import "./App.css";

const App: React.FC = () => {
	const storeMessage = useMessageStore((state) => state.storeMessage);

	const { isLogged, setIsLogged } = useLoginStore();

	useEffect(() => {
		const handler = (event: MessageEvent) => {
			const { command, data }: IMessageEvent = event.data;

			if (command === "pushMessage" && data) {
				storeMessage(data as IMessage);
			} else if (command === "receiveLogin" && data) {
				setIsLogged(true);
			}
		};

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
