import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Home, ArrowLeft, Search, RefreshCw, WifiOff } from "lucide-react";

const NotFound = () => {
	const location = useLocation();
	const navigate = useNavigate();
	const [isOnline, setIsOnline] = useState(navigator.onLine);

	useEffect(() => {
		console.error("404 Error: User attempted to access non-existent route:", location.pathname);

		const handleOnline = () => setIsOnline(true);
		const handleOffline = () => setIsOnline(false);

		window.addEventListener("online", handleOnline);
		window.addEventListener("offline", handleOffline);

		return () => {
			window.removeEventListener("online", handleOnline);
			window.removeEventListener("offline", handleOffline);
		};
	}, [location.pathname]);

	const handleGoBack = () => {
		if (window.history.length > 2) {
			navigate(-1);
		} else {
			navigate("/");
		}
	};

	const handleRefresh = () => {
		window.location.reload();
	};

	// Offline state
	if (!isOnline) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-background p-4">
				<Card className="w-full max-w-md border-destructive/50">
					<CardContent className="pt-8 pb-8 px-6 text-center">
						<div className="w-20 h-20 mx-auto mb-6 rounded-full bg-destructive/10 flex items-center justify-center">
							<WifiOff className="w-10 h-10 text-destructive" />
						</div>
						
						<h1 className="text-2xl font-bold mb-2">Sem conexão</h1>
						<p className="text-muted-foreground mb-6">
							Você está offline. Verifique sua conexão com a internet e tente novamente.
						</p>

						<div className="flex flex-col gap-3">
							<Button onClick={handleRefresh} className="w-full gap-2">
								<RefreshCw className="w-4 h-4" />
								Tentar novamente
							</Button>
						</div>
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className="min-h-screen flex items-center justify-center bg-background p-4">
			<Card className="w-full max-w-md">
				<CardContent className="pt-8 pb-8 px-6 text-center">
					{/* Animated 404 */}
					<div className="relative mb-6">
						<div className="text-[120px] sm:text-[150px] font-black text-primary/10 leading-none select-none">
							404
						</div>
						<div className="absolute inset-0 flex items-center justify-center">
							<div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
								<Search className="w-10 h-10 sm:w-12 sm:h-12 text-primary" />
							</div>
						</div>
					</div>

					<h1 className="text-2xl sm:text-3xl font-bold mb-2">
						Página não encontrada
					</h1>
					
					<p className="text-muted-foreground mb-2">
						Ops! A página que você está procurando não existe ou foi movida.
					</p>

					{location.pathname !== "/" && (
						<p className="text-xs text-muted-foreground/70 mb-6 font-mono break-all">
							{location.pathname}
						</p>
					)}

					<div className="flex flex-col sm:flex-row gap-3 justify-center">
						<Button 
							variant="outline" 
							onClick={handleGoBack}
							className="gap-2"
						>
							<ArrowLeft className="w-4 h-4" />
							Voltar
						</Button>
						
						<Button 
							onClick={() => navigate("/")}
							className="gap-2"
						>
							<Home className="w-4 h-4" />
							Ir para o início
						</Button>
					</div>

					{/* Helpful links */}
					<div className="mt-8 pt-6 border-t">
						<p className="text-xs text-muted-foreground mb-3">
							Páginas que podem te ajudar:
						</p>
						<div className="flex flex-wrap justify-center gap-2">
							<Button 
								variant="ghost" 
								size="sm" 
								onClick={() => navigate("/login")}
								className="text-xs"
							>
								Entrar
							</Button>
							<Button 
								variant="ghost" 
								size="sm" 
								onClick={() => navigate("/register")}
								className="text-xs"
							>
								Cadastrar
							</Button>
							<Button 
								variant="ghost" 
								size="sm" 
								onClick={() => navigate("/help")}
								className="text-xs"
							>
								Ajuda
							</Button>
						</div>
			</div>
				</CardContent>
			</Card>
		</div>
	);
};

export default NotFound;
