import { useLoginStore } from "store/login.store";

import vscode from "utils/vscode";
import "./Actions.css";

export default function Actions() {
	const { loginData } = useLoginStore();

	const handleLeave = () => {
		vscode.postMessage({ command: "leaveConnection", data: null });
	};

	return (
		<div id="actions">
			{loginData && (
				<>
					<button id="leave-button" className="danger" onClick={handleLeave}>
						Quitter
					</button>

					<hr />
				</>
			)}
		</div>
	);
}
