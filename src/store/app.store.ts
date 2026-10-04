import { create } from "zustand";

type Appstore = {
	showAboutModal: boolean;
	displayEvents: boolean;
	logged: boolean;
	setDisplayEvents: (displayEvents: boolean) => void;
	setShowAboutModal: (showAboutModal: boolean) => void;
	setLogged: (logged: boolean) => void;
};

export const useAppstore = create<Appstore>((set) => ({
	showAboutModal: false,
	displayEvents: true,
	logged: false,
	setShowAboutModal: (showAboutModal) => set(() => ({ showAboutModal })),
	setDisplayEvents: (displayEvents) => set(() => ({ displayEvents })),
	setLogged: (logged) => set(() => ({ logged })),
}));
