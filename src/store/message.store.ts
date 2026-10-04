import { create } from "zustand";

type MessageStore = {
	messages: MessageData[];
	storeMessage: (message: MessageData) => void;
	storeAllMessage: (messages: MessageData[]) => void;
};

export const useMessageStore = create<MessageStore>((set) => ({
	messages: [],
	storeMessage: (data: MessageData) => set((state) => ({ messages: [...state.messages, data] })),
	storeAllMessage: (data: MessageData[]) => set((state) => ({ messages: data })),
}));
