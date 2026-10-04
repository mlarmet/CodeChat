import { create } from "zustand";

type LoginStore = {
	loginData: ILoginData | null;
	remoteConnected: boolean;
	displayEvents: boolean;
	peers: PeerInfo[];
	setLoginData: (data: ILoginData | null) => void;
	setList: (peers: PeerInfo[], remoteConnected: boolean) => void;
	setDisplayEvents: (displayEvents: boolean) => void;
};

export const useLoginStore = create<LoginStore>((set) => ({
	loginData: null,
	remoteConnected: false,
	displayEvents: true,
	peers: [],
	setLoginData: (data: ILoginData | null) => set(() => ({ loginData: data })),
	setList: (peers, remoteConnected) => set(() => ({ peers, remoteConnected })),
	setDisplayEvents: (displayEvents) => set(() => ({ displayEvents })),
}));
