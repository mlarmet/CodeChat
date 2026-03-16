import { useEffect } from "react";
import { useMessageStore } from "../../store/message.store";

import Chat from "../components/Chat/Chat";
import MessageFeed from "../components/Message/Message";

import "./App.css";
import "./style.css";

const App: React.FC = () => {
	const storeMessage = useMessageStore((state) => state.storeMessage);

	useEffect(() => {
		const handler = (event: MessageEvent) => {
			console.log(event);

			const { command, data }: IMessageEvent = event.data;

			if (command === "postMessage" && data) {
				storeMessage(data as IMessage);
			}
		};

		window.addEventListener("message", handler);
		return () => window.removeEventListener("message", handler);
	}, []);

	return (
		<main>
			<MessageFeed />
			<Chat />
		</main>
	);
};

export default App;
