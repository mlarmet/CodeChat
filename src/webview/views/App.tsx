import { useEffect } from "react";

import { useLoginStore } from "store/login.store";
import { useMessageStore } from "store/message.store";

import Chat from "@/components/Chat/Chat";
import Login from "@/components/Login/Login";
import MessageFeed from "@/components/Message/Message";

import "./App.css";

const App: React.FC = () => {
	const storeMessage = useMessageStore((state) => state.storeMessage);

	const { isLogged, setIsLogged } = useLoginStore();

	useEffect(() => {
		const handler = (event: MessageEvent) => {
			const { command, data }: IMessageEvent = event.data;

			if (!data) return;

			switch (command) {
				case "pushMessage":
					storeMessage(data as IMessage);
					break;
				case "receiveLogin":
					setIsLogged(true);
					break;
				default:
					break;
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
