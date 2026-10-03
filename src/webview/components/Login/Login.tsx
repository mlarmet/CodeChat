import { useEffect, useState } from "react";

import vscode from "utils/vscode";

import { useLoginStore } from "store/login.store";
import "./Login.css";

export default function Login() {
	const { loginData } = useLoginStore();

	const [username, setUsername] = useState("");
	const [isHost, setIsHost] = useState(true);
	const [ipClient, setIpClient] = useState("");

	const handleLogin = (e: React.SubmitEvent<HTMLFormElement>) => {
		e.preventDefault();

		const loginData: ILoginData = { username, isHost, ipClient };

		vscode.postMessage({ command: "sendLogin", data: loginData });
	};

	useEffect(() => {
		if (loginData) {
			setUsername(loginData.username);
			setIsHost(loginData.isHost);
			setIpClient(loginData.ipClient);
		}
	}, [loginData]);

	return (
		<div id="login">
			<form id="login-form" onSubmit={handleLogin}>
				<div className="form-col w-100">
					<input
						type="text"
						name="username"
						id="username"
						placeholder="Pseudo"
						value={username}
						autoFocus
						className="w-100"
						onChange={(e) => setUsername(e.currentTarget.value)}
					/>
				</div>
				<div className="form-row w-100">
					<div id="bottom" className="form-col w-100">
						<input
							type="text"
							name="ip-client"
							id="ip-client"
							placeholder="IP"
							value={isHost ? "" : ipClient}
							disabled={isHost}
							className="w-100"
							onChange={(e) => setIpClient(e.currentTarget.value)}
						/>
					</div>
					<div id="is-host-container">
						<input type="checkbox" name="isHost" id="isHost" checked={isHost} onChange={(e) => setIsHost(e.currentTarget.checked)} />
						<label htmlFor="isHost">Host</label>
					</div>
				</div>

				<button id="send" type="submit" className="w-100" disabled={!username.trim()}>
					Démarrer
				</button>
			</form>
		</div>
	);
}
