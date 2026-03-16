import { create } from "zustand";

const fillData = [
	{ text: "Hello", author: "MAL", datetime: new Date("2026-03-16") },
	{ text: "Hello", author: "MLA", datetime: new Date("2026-03-16") },
	{ text: "Hello", author: "MAL", datetime: new Date() },
	{ text: "Hello", author: "MLA", datetime: new Date() },
	{ text: "Hello", author: "MAL", datetime: new Date() },
	{ text: "Hello", author: "MLA", datetime: new Date() },
];

type MessageStore = {
	messages: IMessage[];
	storeMessage: (message: IMessage) => void;
};

export const useMessageStore = create<MessageStore>((set) => ({
	messages: structuredClone(fillData),
	storeMessage: (message: IMessage) => set((state) => ({ messages: [...state.messages, message] })),
}));
