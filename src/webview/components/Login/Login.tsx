import { useEffect, useMemo, useState } from "react";

import vscode from "utils/vscode";

import { MAX_PORT, MIN_PORT } from "contants";
import { useLoginStore } from "store/login.store";
import "./Login.css";

export default function Login() {
	const { loginData } = useLoginStore();

	const [username, setUsername] = useState("");
	const [isHost, setIsHost] = useState(true);
	const [ipClient, setIpClient] = useState("");

	const [port, setPort] = useState(-1);
	const [showPort, setShowPort] = useState("0");

	const handleLogin = (e: React.SubmitEvent<HTMLFormElement>) => {
		e.preventDefault();

		const loginData: ILoginData = { username, isHost, ipClient, port };

		vscode.postMessage({ command: "sendLogin", data: loginData });
	};

	const handlePortChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const input = e.currentTarget;

		const value = parseInt(input.value, 10);

		if (!isNaN(value) && value >= MIN_PORT && value <= MAX_PORT) {
			setPort(value);
		} else {
			setPort(-1);
		}

		setShowPort(input.value);
	};

	const isFormValid = useMemo(
		() => username.length > 0 && port >= MIN_PORT && port <= MAX_PORT && (isHost || ipClient.length > 0),
		[username, isHost, ipClient, port],
	);

	useEffect(() => {
		if (loginData) {
			setUsername(loginData.username);
			setIsHost(loginData.isHost);
			setIpClient(loginData.ipClient);
			setPort(loginData.port);
			setShowPort(`${loginData.port}`);
		}
	}, [loginData]);

	return (
		<div id="login">
			<form id="login-form" onSubmit={handleLogin}>
				<div className="form-row w-100">
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
					<div id="is-host-container">
						<input type="checkbox" name="isHost" id="isHost" checked={isHost} onChange={(e) => setIsHost(e.currentTarget.checked)} />
						<label htmlFor="isHost">Host</label>
					</div>
				</div>
				<div className="form-row w-100">
					<div className="form-col w-100">
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
					<span> : </span>
					<div className="form-col w-100">
						<input
							type="text"
							name="port"
							id="port"
							placeholder="Port"
							value={showPort}
							maxLength={5}
							className="w-100"
							onChange={handlePortChange}
						/>
					</div>
				</div>

				<button id="send" type="submit" className="w-100" disabled={!isFormValid}>
					Démarrer
				</button>
			</form>
		</div>
	);
}
