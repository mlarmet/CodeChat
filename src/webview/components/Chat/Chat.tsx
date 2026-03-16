import { useState } from "react";

import vscode from "../../vscode";

import "./Chat.css";

export default function Chat() {
	const [message, setMessage] = useState("");

	const handleMessageSend = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();

		const message = {
			author: "MAL", // TODO : get me in settings
			text: e.currentTarget.message.value,
			datetime: new Date(),
		};

		vscode.postMessage({ command: "sendMessage", data: message });
		setMessage("");
	};

	return (
		<div id="form">
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
