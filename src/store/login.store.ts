import { create } from "zustand";

type LoginStore = {
	isLogged: boolean;
	username: string;

	setUsername: (username: string) => void;
	setIsLogged: (isLogged: boolean) => void;
};

export const useLoginStore = create<LoginStore>((set) => ({
	isLogged: false,
	username: "",

	setUsername: (name: string) => set(() => ({ username: name })),
	setIsLogged: (logged: boolean) => set(() => ({ isLogged: logged })),
}));
