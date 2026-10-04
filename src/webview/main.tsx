import React from "react";
import { createRoot } from "react-dom/client";

import { ModalProvider } from "./components/Modal/ModalProvider";

import App from "@/views/App";

import "utils/vscode";

import "./style.css";

const container = document.getElementById("root");

if (!container) {
	throw new Error("Root element #root not found");
}

createRoot(container).render(
	<React.StrictMode>
		<ModalProvider>
			<App />
		</ModalProvider>
	</React.StrictMode>,
);
