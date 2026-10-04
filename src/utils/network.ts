import { networkInterfaces } from "os";

export function getLocalIPv4(): string | undefined {
	for (const addrs of Object.values(networkInterfaces())) {
		for (const addr of addrs ?? []) {
			if (addr.family === "IPv4" && !addr.internal) {
				return addr.address;
			}
		}
	}
}
