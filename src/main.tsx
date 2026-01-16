import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { registerSW } from "virtual:pwa-register";

createRoot(document.getElementById("root")!).render(<App />);

try {
	registerSW({
		immediate: true,
	});
} catch (error) {
	console.warn("Falha ao registrar o Service Worker do Coliseu.", error);
}
