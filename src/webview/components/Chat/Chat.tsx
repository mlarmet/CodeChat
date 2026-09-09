import { useState } from "react";

import vscode from "utils/vscode";

import { useLoginStore } from "store/login.store";

import "./Chat.css";

export default function Chat() {
	const { username } = useLoginStore();
	const [message, setMessage] = useState("");

	const handleMessageSend = (e: React.SubmitEvent<HTMLFormElement>) => {
		e.preventDefault();

		const message: IMessageData = {
			author: username,
			text: e.currentTarget.message.value,
			datetime: new Date(),
		};

		vscode.postMessage({ command: "sendMessage", data: message });
		setMessage("");
	};

	return (
		<div id="chat">
			<form id="message-form" onSubmit={handleMessageSend}>
				<textarea
					name="message"
					id="message"
					placeholder="Message"
					value={message}
					onInput={(e) => setMessage(e.currentTarget.value)}
					onChange={(e) => setMessage(e.currentTarget.value)}
				/>
				<button id="send" type="submit" disabled={!message.trim()}>
					Envoyer
				</button>
			</form>
		</div>
	);
}
