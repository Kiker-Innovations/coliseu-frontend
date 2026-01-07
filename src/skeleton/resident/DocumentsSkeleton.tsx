import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function DocumentsSkeleton() {
	return (
		<div className="space-y-6">
			<Skeleton className="h-10 w-64 mb-6" />

			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				{[...Array(6)].map((_, i) => (
					<Card key={i}>
						<CardHeader>
							<Skeleton className="h-6 w-48" />
							<Skeleton className="h-4 w-full mt-2" />
						</CardHeader>
						<CardContent className="space-y-3">
							<div className="flex items-center gap-2">
								<Skeleton className="h-4 w-24" />
								<Skeleton className="h-4 w-16" />
							</div>
							<Skeleton className="h-4 w-32" />
							<div className="flex gap-2">
								<Skeleton className="h-10 w-24" />
								<Skeleton className="h-10 w-24" />
							</div>
						</CardContent>
					</Card>
				))}
			</div>
		</div>
	);
}
