import { create } from "zustand";

const fillData: IMessageData[] = [];

type MessageStore = {
	messages: IMessageData[];
	storeMessage: (message: IMessageData) => void;
	storeAllMessage: (messages: IMessageData[]) => void;
};

export const useMessageStore = create<MessageStore>((set) => ({
	messages: structuredClone(fillData),
	storeMessage: (data: IMessageData) => set((state) => ({ messages: [...state.messages, data] })),
	storeAllMessage: (data: IMessageData[]) => set((state) => ({ messages: data })),
}));
