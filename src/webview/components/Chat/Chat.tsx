import { useState } from "react";

import vscode from "utils/vscode";

import { useLoginStore } from "store/login.store";

import "./Chat.css";

export default function Chat() {
	const { loginData, remoteConnected } = useLoginStore();
	const [message, setMessage] = useState("");

	const handleMessageSend = (e: React.SubmitEvent<HTMLFormElement>) => {
		e.preventDefault();

		if (!remoteConnected || !loginData) return;

		const message: IMessageData = {
			author: loginData.username,
			text: e.currentTarget.message.value,
			datetime: new Date(),
		};

		vscode.postMessage({ command: "sendMessage", data: message });
		setMessage("");
	};

	return (
		<div id="chat" className={remoteConnected ? "" : "remote-off"}>
			<p id="remote-status">{loginData?.isHost ? "En attente de connexion..." : "En attente de la connexion de l'hôte..."}</p>
			<form id="message-form" onSubmit={handleMessageSend}>
				<textarea
					name="message"
					id="message"
					placeholder="Message"
					disabled={!remoteConnected}
					value={message}
					onInput={(e) => setMessage(e.currentTarget.value)}
					onChange={(e) => setMessage(e.currentTarget.value)}
				/>
				<button id="send" type="submit" disabled={!message.trim() || !remoteConnected}>
					Envoyer
				</button>
			</form>
		</div>
	);
}
