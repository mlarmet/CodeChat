import { useState } from "react";

import vscode from "utils/vscode";

import "./Login.css";

export default function Login() {
	const [username, setUsername] = useState("");
	const [isHost, setIsHost] = useState(true);
	const [ipClient, setIpClient] = useState("");

	const handleLogin = (e: React.SubmitEvent<HTMLFormElement>) => {
		e.preventDefault();

		const loginData = { username: "MAL", isHost: true, ipClient: "192.168.1.13" };

		vscode.postMessage({ command: "sendLogin", data: loginData });
		setUsername("");
		setIsHost(true);
		setIpClient("");
	};

	return (
		<div id="login">
			<form id="login-form" onSubmit={handleLogin}>
				<div className="form-col full">
					<label htmlFor="username">Pseudo</label>
					<input
						type="text"
						name="username"
						id="username"
						placeholder="Pseudo"
						value={username}
						onInput={(e) => setUsername(e.currentTarget.value)}
						onChange={(e) => setUsername(e.currentTarget.value)}
					/>
				</div>
				<div className="form-row full">
					<div id="bottom" className="form-col full">
						<label htmlFor="ip-client">IP</label>
						<input
							type="text"
							name="ip-client"
							id="ip-client"
							placeholder="IP"
							value={ipClient}
							onInput={(e) => setIpClient(e.currentTarget.value)}
							onChange={(e) => setIpClient(e.currentTarget.value)}
						/>
					</div>
					<div className="form-col">
						<label htmlFor="isHost">Host</label>
						<input
							type="checkbox"
							name="isHost"
							id="isHost"
							checked={isHost}
							onInput={(e) => setIsHost(e.currentTarget.checked)}
							onChange={(e) => setIsHost(e.currentTarget.checked)}
						/>
					</div>
				</div>

				<button id="send" type="submit" disabled={!username.trim()}>
					Démarrer
				</button>
			</form>
		</div>
	);
}
