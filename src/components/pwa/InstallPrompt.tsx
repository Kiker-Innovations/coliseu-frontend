import * as React from "react";
import { Button } from "@/components/ui/button";

type BeforeInstallPromptEvent = Event & {
	prompt: () => Promise<void>;
	userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_STORAGE_KEY = "coliseu:pwa-install-dismissed-at";
const DISMISS_WINDOW_DAYS = 7;

const isIosDevice = () =>
	/iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as Window & { MSStream?: boolean }).MSStream;

const isStandaloneMode = () =>
	window.matchMedia("(display-mode: standalone)").matches ||
	(navigator as Navigator & { standalone?: boolean }).standalone === true;

const shouldSuppressPrompt = () => {
	const storedValue = window.localStorage.getItem(DISMISS_STORAGE_KEY);
	if (!storedValue) {
		return false;
	}

	const dismissedAt = Number(storedValue);
	if (!Number.isFinite(dismissedAt)) {
		return false;
	}

	const dismissWindowMs = DISMISS_WINDOW_DAYS * 24 * 60 * 60 * 1000;
	return Date.now() - dismissedAt < dismissWindowMs;
};

export function InstallPrompt() {
	const [promptEvent, setPromptEvent] = React.useState<BeforeInstallPromptEvent | null>(null);
	const [isVisible, setIsVisible] = React.useState(false);

	React.useEffect(() => {
		const handleBeforeInstallPrompt = (event: Event) => {
			event.preventDefault();
			setPromptEvent(event as BeforeInstallPromptEvent);
		};

		window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
		return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
	}, []);

	React.useEffect(() => {
		if (isStandaloneMode() || shouldSuppressPrompt()) {
			setIsVisible(false);
			return;
		}

		if (isIosDevice()) {
			setIsVisible(true);
			return;
		}

		if (promptEvent) {
			setIsVisible(true);
		}
	}, [promptEvent]);

	const handleDismiss = () => {
		window.localStorage.setItem(DISMISS_STORAGE_KEY, Date.now().toString());
		setIsVisible(false);
	};

	const handleInstallClick = async () => {
		if (!promptEvent) {
			return;
		}

		try {
			await promptEvent.prompt();
			await promptEvent.userChoice;
		} catch (error) {
			console.warn("Falha ao exibir o prompt de instalação do Coliseu.", error);
		} finally {
			setPromptEvent(null);
			setIsVisible(false);
		}
	};

	if (!isVisible) {
		return null;
	}

	const isIos = isIosDevice();

	return (
		<div className="fixed inset-x-4 bottom-4 z-50 rounded-xl border border-border bg-card p-4 shadow-lg md:inset-x-auto md:right-6 md:max-w-sm">
			<div className="flex flex-col gap-3">
				<div>
					<p className="text-sm font-semibold text-foreground">Adicionar o Coliseu à tela inicial</p>
					<p className="text-xs text-muted-foreground">
						Acesse o app com mais rapidez e use em tela cheia.
					</p>
				</div>

				{isIos ? (
					<div className="text-xs text-muted-foreground">
						No Safari, toque em <strong>Compartilhar</strong> e selecione{" "}
						<strong>Adicionar à Tela de Início</strong>.
					</div>
				) : (
					<Button onClick={handleInstallClick}>Instalar Coliseu</Button>
				)}

				<Button variant="ghost" onClick={handleDismiss}>
					Agora não
				</Button>
			</div>
		</div>
	);
}

