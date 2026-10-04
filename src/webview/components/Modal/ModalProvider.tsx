import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { Modal } from "./Modal";

export interface OpenOptions {
	title?: string;
	width?: number | string;
	dismissible?: boolean;
	footer?: ReactNode;
	/** Appelé quand la modale est fermée par Échap / fond / croix. */
	onDismiss?: () => void;
}

export interface ConfirmOptions {
	title?: string;
	message: ReactNode;
	confirmLabel?: string;
	cancelLabel?: string;
}

type Content = ReactNode | ((close: () => void) => ReactNode);

interface Entry extends OpenOptions {
	id: number;
	content: Content;
}

interface ModalApi {
	/** Ouvre n'importe quel composant dans la modale. Retourne l'id. */
	open: (content: Content, options?: OpenOptions) => number;
	/** Ferme une modale par id, ou la dernière ouverte. */
	close: (id?: number) => void;
	/** Confirmation : résout true (confirmer) ou false (annuler / Échap / fond). */
	confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ModalContext = createContext<ModalApi | null>(null);
let nextId = 0;

export function ModalProvider({ children }: { children: ReactNode }) {
	const [stack, setStack] = useState<Entry[]>([]);

	const close = useCallback((id?: number) => {
		setStack((s) => (id === undefined ? s.slice(0, -1) : s.filter((m) => m.id !== id)));
	}, []);

	const open = useCallback<ModalApi["open"]>((content, options = {}) => {
		const id = ++nextId;
		setStack((s) => [...s, { ...options, id, content }]);
		return id;
	}, []);

	const confirm = useCallback<ModalApi["confirm"]>(
		({ title, message, confirmLabel = "OK", cancelLabel = "Annuler" }) =>
			new Promise<boolean>((resolve) => {
				const id = ++nextId;
				const settle = (value: boolean) => {
					close(id);
					resolve(value);
				};
				setStack((s) => [
					...s,
					{
						id,
						title,
						content: message,
						onDismiss: () => resolve(false),
						footer: (
							<>
								<button className="secondary" onClick={() => settle(false)}>
									{cancelLabel}
								</button>
								<button data-autofocus onClick={() => settle(true)}>
									{confirmLabel}
								</button>
							</>
						),
					},
				]);
			}),
		[close],
	);

	const api = useMemo(() => ({ open, close, confirm }), [open, close, confirm]);

	return (
		<ModalContext.Provider value={api}>
			{children}
			{stack.map((m) => (
				<Modal
					key={m.id}
					title={m.title}
					width={m.width}
					dismissible={m.dismissible}
					footer={m.footer}
					onClose={() => {
						m.onDismiss?.();
						close(m.id);
					}}
				>
					{typeof m.content === "function" ? m.content(() => close(m.id)) : m.content}
				</Modal>
			))}
		</ModalContext.Provider>
	);
}

export function useModal(): ModalApi {
	const ctx = useContext(ModalContext);
	if (!ctx) throw new Error("useModal doit être utilisé dans <ModalProvider>");
	return ctx;
}
