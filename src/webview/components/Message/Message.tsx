import { useEffect, useRef } from "react";
import { format } from "date-fns";

import { useMessageStore } from "store/message.store";

import "./Message.css";

export default function MessageFeed() {
	// scroll to end of message feed
	const elementRef = useRef<HTMLDivElement>(null);

	const messages = useMessageStore((state) => state.messages);

	useEffect(() => {
		elementRef.current?.lastElementChild?.scrollIntoView({ behavior: "smooth" });
	}, [messages, elementRef]);

	return (
		<div id="message-container" ref={elementRef}>
			{messages.map((message, index) => (
				<Message key={index} message={message} />
			))}
		</div>
	);
}

interface IMessageProps {
	message: IMessage;
}

function Message({ message }: IMessageProps) {
	// TODO : get owner in settings
	const isOwner = message.author === "MAL";

	const getDatetime = () => {
		const now = new Date();
		const date = new Date(message.datetime);

		const formmatter = now.getDay() === date.getDay() ? "HH:mm" : "dd/MM/yyyy HH:mm";

		return format(message.datetime, formmatter);
	};

	return (
		<div className={"message-row" + (isOwner ? " owner" : "")}>
			<div className="message-block">
				<p className="message-infos">
					<strong>{message.author}</strong> - {getDatetime()}
				</p>
				<div className={"message-box" + (isOwner ? " owner" : "")}>
					<p>{message.text}</p>
				</div>
			</div>
		</div>
	);
}
