import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Wrench, RefreshCw, Clock } from "lucide-react";

export default function Maintenance() {
	const handleRefresh = () => {
		window.location.reload();
	};

	return (
		<div className="min-h-screen flex items-center justify-center bg-background p-4">
			<Card className="w-full max-w-md border-amber-500/30">
				<CardContent className="pt-8 pb-8 px-6 text-center">
					{/* Maintenance Icon */}
					<div className="relative mb-6">
						<div className="w-24 h-24 mx-auto rounded-full bg-amber-500/10 flex items-center justify-center">
							<Wrench className="w-12 h-12 text-amber-500 animate-pulse" />
						</div>
					</div>

					<h1 className="text-2xl sm:text-3xl font-bold mb-2 text-amber-600">
						Em manutenção
					</h1>
					
					<p className="text-muted-foreground mb-4">
						Estamos realizando melhorias no sistema. Voltaremos em breve!
					</p>

					<div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-6">
						<Clock className="w-4 h-4" />
						<span>Previsão: alguns minutos</span>
					</div>

					<Button 
						onClick={handleRefresh}
						variant="outline"
						className="gap-2"
					>
						<RefreshCw className="w-4 h-4" />
						Verificar novamente
					</Button>

					<p className="mt-6 text-xs text-muted-foreground">
						Se o problema persistir, entre em contato com o suporte.
					</p>
				</CardContent>
			</Card>
		</div>
	);
}

