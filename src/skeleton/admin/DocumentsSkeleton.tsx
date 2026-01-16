import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function DocumentsSkeleton() {
	return (
		<div className="space-y-6">
			<div>
				<Skeleton className="h-9 w-48 mb-2" />
				<Skeleton className="h-5 w-96" />
			</div>

			<Tabs defaultValue="view" className="space-y-6">
				<TabsList>
					<TabsTrigger value="view" disabled>
						Documentos Publicados
					</TabsTrigger>
					<TabsTrigger value="publish" disabled>
						Publicar Novo Documento
					</TabsTrigger>
				</TabsList>

				<TabsContent value="view" className="space-y-4">
					{[1, 2, 3].map((i) => (
						<Card key={i}>
							<CardHeader>
								<div className="flex items-start justify-between">
									<div className="flex-1 space-y-3">
										<div className="flex items-center gap-2">
											<Skeleton className="h-5 w-5" />
											<Skeleton className="h-6 w-64" />
										</div>
										<Skeleton className="h-4 w-full max-w-lg" />
										<div className="flex items-center gap-4">
											<Skeleton className="h-4 w-40" />
											<Skeleton className="h-5 w-20" />
											<Skeleton className="h-5 w-16" />
										</div>
									</div>
									<div className="flex gap-2">
										<Skeleton className="h-8 w-8" />
										<Skeleton className="h-8 w-8" />
										<Skeleton className="h-8 w-8" />
										<Skeleton className="h-8 w-8" />
									</div>
								</div>
							</CardHeader>
						</Card>
					))}
				</TabsContent>
			</Tabs>
		</div>
	);
}
