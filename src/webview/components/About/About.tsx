import { useMemo, useState } from "react";

import { useAppstore } from "store/app.store";
import { useLoginStore } from "store/login.store";

import "./About.css";

const STATUS_LABEL: Record<PeerStatus, string> = {
	online: "Connecté",
	busy: "Occupé",
	offline: "Déconnecté",
};

// Hôte d'abord, puis en ligne, puis ordre alphabétique
const comparePeers = (a: PeerInfo, b: PeerInfo) =>
	Number(!!b.isHost) - Number(!!a.isHost) || Number(b.status === "online") - Number(a.status === "online") || a.name.localeCompare(b.name);

export default function About() {
	const { loginData, peers, remoteConnected } = useLoginStore();
	const { logged } = useAppstore();

	const sorted = useMemo(() => [...peers].sort(comparePeers), [peers]);
	const onlineCount = peers.filter((p) => p.status === "online").length;

	const myStatus: PeerStatus = logged ? (peers.find((p) => p.id === loginData?.id)?.status ?? "offline") : "offline";
	const isHost = logged && !!loginData?.isHost;

	return (
		<div className="about">
			<div className="about-status">
				<span className={`about-dot about-dot--${myStatus}`} />
				<strong>{STATUS_LABEL[myStatus]}</strong>
				{isHost && <span className="badge">Hôte</span>}
			</div>

			{logged && (
				<dl className="about-info">
					<dt>Serveur</dt>
					<dd>
						<Copyable value={`${loginData?.ipClient}:${loginData?.port}`} />
					</dd>
				</dl>
			)}

			{isHost && <p className="about-muted about-hint">Partage ton IP et le port pour que les autres puissent se connecter.</p>}

			<hr />

			<div className="about-section-title">
				Participants
				{remoteConnected && (
					<span className="about-muted">
						{" "}
						· {onlineCount}/{peers.length} en ligne
					</span>
				)}
			</div>

			{!logged ? (
				<p className="about-muted">Connecte-toi pour voir les participants.</p>
			) : sorted.length === 0 ? (
				<p className="about-muted">Aucun participant.</p>
			) : (
				<ul className="about-members">
					{sorted.map((p) => (
						<li key={p.id} className={`about-member${p.status === "online" ? "" : " about-member--offline"}`}>
							<span className={`about-dot about-dot--${p.status}`} />
							<span>{p.name}</span>
							{p.id === loginData?.id && <span className="about-muted">(vous)</span>}
							{p.isHost && <span className="badge">Hôte</span>}
						</li>
					))}
				</ul>
			)}
		</div>
	);
}

function Copyable({ value }: { value: string }) {
	const [copied, setCopied] = useState(false);
	const copy = async () => {
		try {
			await navigator.clipboard.writeText(value);
			setCopied(true);
			setTimeout(() => setCopied(false), 1200);
		} catch {
			/* clipboard indisponible : on ignore */
		}
	};
	return (
		<code className="about-copy" title="Cliquer pour copier" onClick={copy}>
			{copied ? "Copié ✓" : value}
		</code>
	);
}
