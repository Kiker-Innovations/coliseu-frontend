import { useNavigate, useRouteError, isRouteErrorResponse } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, Home, RefreshCw, ArrowLeft } from "lucide-react";

interface ErrorInfo {
	title: string;
	message: string;
	code?: string | number;
}

function getErrorInfo(error: unknown): ErrorInfo {
	if (isRouteErrorResponse(error)) {
		switch (error.status) {
			case 404:
				return {
					title: "Página não encontrada",
					message: "A página que você está procurando não existe.",
					code: 404,
				};
			case 401:
				return {
					title: "Não autorizado",
					message: "Você precisa estar logado para acessar esta página.",
					code: 401,
				};
			case 403:
				return {
					title: "Acesso negado",
					message: "Você não tem permissão para acessar esta página.",
					code: 403,
				};
			case 500:
				return {
					title: "Erro interno",
					message: "Ocorreu um erro no servidor. Tente novamente mais tarde.",
					code: 500,
				};
			case 503:
				return {
					title: "Serviço indisponível",
					message: "O serviço está temporariamente indisponível. Tente novamente em alguns minutos.",
					code: 503,
				};
			default:
				return {
					title: "Erro inesperado",
					message: error.statusText || "Algo deu errado.",
					code: error.status,
				};
		}
	}

	if (error instanceof Error) {
		return {
			title: "Erro na aplicação",
			message: error.message || "Ocorreu um erro inesperado.",
		};
	}

	return {
		title: "Erro desconhecido",
		message: "Ocorreu um erro inesperado. Tente recarregar a página.",
	};
}

export default function ErrorPage() {
	const navigate = useNavigate();
	const error = useRouteError();
	const errorInfo = getErrorInfo(error);

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

	return (
		<div className="min-h-screen flex items-center justify-center bg-background p-4">
			<Card className="w-full max-w-md border-destructive/30">
				<CardContent className="pt-8 pb-8 px-6 text-center">
					<div className="relative mb-6">
						{errorInfo.code && (
							<div className="text-[100px] sm:text-[120px] font-black text-destructive/70 leading-none select-none">
								{errorInfo.code}
							</div>
						)}
					</div>

					<h1 className="text-2xl sm:text-3xl font-bold mb-2 text-destructive">
						{errorInfo.title}
					</h1>
					
					<p className="text-muted-foreground mb-6">
						{errorInfo.message}
					</p>

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
							variant="outline" 
							onClick={handleRefresh}
							className="gap-2"
						>
							<RefreshCw className="w-4 h-4" />
							Recarregar
						</Button>
						
						<Button 
							onClick={() => navigate("/")}
							className="gap-2"
						>
							<Home className="w-4 h-4" />
							Início
						</Button>
					</div>

					{/* Debug info in development */}
					{import.meta.env.DEV && error instanceof Error && (
						<details className="mt-6 text-left">
							<summary className="text-xs text-muted-foreground cursor-pointer">
								Detalhes técnicos
							</summary>
							<pre className="mt-2 p-3 bg-muted rounded text-xs overflow-auto max-h-40">
								{error.stack}
							</pre>
						</details>
					)}
				</CardContent>
			</Card>
		</div>
	);
}

