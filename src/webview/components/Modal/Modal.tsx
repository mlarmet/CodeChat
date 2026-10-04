import { useEffect, useRef, type ReactNode } from "react";

import "./Modal.css";

export interface ModalProps {
	title?: string;
	width?: number | string;
	/** Échap et clic sur le fond ferment la modale. */
	dismissible?: boolean;
	onClose: () => void;
	footer?: ReactNode;
	children: ReactNode;
}

// <dialog> natif : focus trap, Échap, backdrop et restauration du focus gérés par le navigateur.
export function Modal({ title, width, dismissible = true, onClose, footer, children }: ModalProps) {
	const ref = useRef<HTMLDialogElement>(null);

	useEffect(() => {
		const el = ref.current!;
		if (!el.open) el.showModal();
		el.querySelector<HTMLElement>("[data-autofocus]")?.focus();
	}, []);

	return (
		<dialog
			ref={ref}
			className="modal"
			style={width ? { width } : undefined}
			onCancel={(e) => {
				e.preventDefault();
				if (dismissible) onClose();
			}}
			onClick={(e) => {
				if (dismissible && e.target === e.currentTarget) onClose();
			}}
		>
			<div className="modal-content">
				{dismissible && (
					<button className="modal-close" aria-label="Fermer" onClick={onClose}>
						<svg width="22" height="22" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
							<path d="M8 8.707l3.646 3.647.708-.707L8.707 8l3.647-3.646-.707-.708L8 7.293 4.354 3.646l-.708.708L7.293 8l-3.647 3.646.708.708L8 8.707z" />
						</svg>
					</button>
				)}
				{title && <h2>{title}</h2>}
				<div>{children}</div>
				{footer && <div className="modal-footer">{footer}</div>}
			</div>
		</dialog>
	);
}
