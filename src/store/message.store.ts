import { create } from "zustand";

type MessageStore = {
	messages: IMessageData[];
	storeMessage: (message: IMessageData) => void;
	storeAllMessage: (messages: IMessageData[]) => void;
};

export const useMessageStore = create<MessageStore>((set) => ({
	messages: [],
	storeMessage: (data: IMessageData) => set((state) => ({ messages: [...state.messages, data] })),
	storeAllMessage: (data: IMessageData[]) => set((state) => ({ messages: data })),
}));
