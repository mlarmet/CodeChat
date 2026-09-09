import { create } from "zustand";

const fillData: IMessageData[] = [];

type MessageStore = {
	messages: IMessageData[];
	storeMessage: (message: IMessageData) => void;
};

export const useMessageStore = create<MessageStore>((set) => ({
	messages: structuredClone(fillData),
	storeMessage: (message: IMessageData) => set((state) => ({ messages: [...state.messages, message] })),
}));
