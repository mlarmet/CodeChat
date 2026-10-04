import { create } from "zustand";

type LoginStore = {
	loginData: ILoginData | null;
	remoteConnected: boolean;
	peers: PeerInfo[];
	setLoginData: (data: ILoginData | null) => void;
	setList: (peers: PeerInfo[], remoteConnected: boolean) => void;
};

export const useLoginStore = create<LoginStore>((set) => ({
	loginData: null,
	remoteConnected: false,
	peers: [],
	setLoginData: (data: ILoginData | null) => set(() => ({ loginData: data })),
	setList: (peers, remoteConnected) => set(() => ({ peers, remoteConnected })),
}));
