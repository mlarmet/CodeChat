import { create } from "zustand";

type LoginStore = {
	loginData: ILoginData | null;
	remoteConnected: boolean;
	setLoginData: (data: ILoginData | null) => void;
	setRemoteConnected: (data: boolean) => void;
};

export const useLoginStore = create<LoginStore>((set) => ({
	loginData: null,
	remoteConnected: false,
	setLoginData: (data: ILoginData | null) => set(() => ({ loginData: data })),
	setRemoteConnected: (data: boolean) => set(() => ({ remoteConnected: data })),
}));
