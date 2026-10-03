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
				<div className="form-col full">
					<input
						type="text"
						name="username"
						id="username"
						placeholder="Pseudo"
						value={username}
						onChange={(e) => setUsername(e.currentTarget.value)}
					/>
				</div>
				<div className="form-row full">
					<div id="bottom" className="form-col full">
						<input
							type="text"
							name="ip-client"
							id="ip-client"
							placeholder="IP"
							value={isHost ? "" : ipClient}
							disabled={isHost}
							onChange={(e) => setIpClient(e.currentTarget.value)}
						/>
					</div>
					<div className="form-row">
						<label htmlFor="isHost">Host</label>
						<input type="checkbox" name="isHost" id="isHost" checked={isHost} onChange={(e) => setIsHost(e.currentTarget.checked)} />
					</div>
				</div>

				<button id="send" type="submit" disabled={!username.trim()}>
					Démarrer
				</button>
			</form>
		</div>
	);
}
