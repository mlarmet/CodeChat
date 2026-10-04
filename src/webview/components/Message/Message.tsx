import { format } from "date-fns";
import { useEffect, useRef } from "react";

import { useLoginStore } from "store/login.store";
import { useMessageStore } from "store/message.store";

import "./Message.css";

export default function MessageFeed() {
	// scroll to end of message feed
	const elementRef = useRef<HTMLDivElement>(null);

	const messages = useMessageStore((state) => state.messages);
	const displayEvents = useLoginStore((state) => state.displayEvents);

	useEffect(() => {
		elementRef.current?.lastElementChild?.scrollIntoView({ behavior: "smooth" });
	}, [messages, elementRef]);

	return (
		<div id="message-container" ref={elementRef}>
			{messages?.length > 0 &&
				messages.map((message, index) => {
					return message.type === "presence" ? (
						displayEvents && <EventMessage key={index} message={message} />
					) : (
						<Message key={index} message={message} />
					);
				})}
		</div>
	);
}

interface IMessageProps {
	message: MessageData;
}

const getDatetime = (datetime: string) => {
	const now = new Date();
	const date = new Date(datetime);

	const formatter = now.getDay() === date.getDay() ? "HH:mm" : "dd/MM/yyyy HH:mm";

	return format(date, formatter);
};

function Message({ message }: IMessageProps) {
	const { loginData } = useLoginStore();

	const isOwner = message.author === loginData?.username;

	return (
		<div className={"message-row" + (isOwner ? " owner" : "")}>
			<div className="message-block">
				<div className="message-infos">
					<strong>{message.author}</strong>
					<span>- {getDatetime(message.datetime)}</span>
				</div>
				<div className={"message-box" + (isOwner ? " owner" : "")}>{message.type === "message" && <p>{message.text}</p>}</div>
			</div>
		</div>
	);
}

function EventMessage({ message }: IMessageProps) {
	const verb = message.type === "presence" && message.event === "join" ? "connecté" : "déconnecté";
	const label = message.type === "presence" && message.isHost ? `L'hôte (${message.author})` : message.author;

	return (
		<div className="message-infos">
			<hr />
			<strong>{label}</strong>
			<span>- {getDatetime(message.datetime)}</span>
			<p>s'est {verb}</p>
			<hr />
		</div>
	);
}
