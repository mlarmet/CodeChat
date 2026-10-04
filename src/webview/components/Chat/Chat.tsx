import { useRef, useState } from "react";

import vscode from "utils/vscode";

import { useLoginStore } from "store/login.store";

import { VscodeProgressBar } from "@vscode-elements/react-elements";
import "./Chat.css";

export default function Chat() {
	const messageFormRef = useRef<HTMLFormElement>(null);

	const { loginData, remoteConnected } = useLoginStore();
	const [message, setMessage] = useState("");

	const handleMessageSend = (e: React.SubmitEvent<HTMLFormElement>) => {
		e.preventDefault();

		if (!remoteConnected || !loginData) return;

		const message: MessageData = {
			authorId: loginData.id,
			authorName: loginData.username,
			text: e.currentTarget.message.value,
			datetime: new Date().toISOString(),
			type: "message",
		};

		vscode.postMessage({ command: "sendMessage", data: message });
		setMessage("");
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
		if (e.key === "Enter" && e.ctrlKey == true) {
			e.preventDefault();
			messageFormRef.current?.requestSubmit();
		}
	};

	return (
		<div id="chat">
			{!remoteConnected && (
				<div id="remote-status" className="w-100">
					<p>En attente de la connexion {loginData?.isHost ? "d'un client..." : "de l'hôte..."}</p>
					<VscodeProgressBar></VscodeProgressBar>
				</div>
			)}

			<form id="message-form" onSubmit={handleMessageSend} ref={messageFormRef}>
				<textarea
					autoFocus
					name="message"
					id="message"
					className="w-100"
					placeholder="Message"
					value={message}
					onKeyDown={(e) => handleKeyDown(e)}
					onChange={(e) => setMessage(e.currentTarget.value)}
				/>

				<button id="send" type="submit" className="w-100" disabled={!message.trim() || !remoteConnected}>
					Envoyer
				</button>
			</form>
		</div>
	);
}
