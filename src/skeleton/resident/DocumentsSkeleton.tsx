import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function DocumentsSkeleton() {
	return (
		<div className="space-y-4 sm:space-y-6">
			{/* Header */}
			<div className="space-y-1 sm:space-y-2">
				<Skeleton className="h-7 sm:h-9 w-32 sm:w-40" />
				<Skeleton className="h-4 sm:h-5 w-48 sm:w-64" />
			</div>

			{/* Grid of Document Cards */}
			<div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
				{[...Array(6)].map((_, i) => (
					<Card key={i} className="overflow-hidden">
						<CardHeader className="pb-2 sm:pb-3">
							<div className="flex items-start justify-between gap-2">
								<Skeleton className="h-6 w-6 sm:h-8 sm:w-8 rounded" />
								<Skeleton className="h-5 sm:h-6 w-12 rounded-full" />
							</div>
							<Skeleton className="h-5 sm:h-6 w-3/4 mt-2" />
							<Skeleton className="h-4 w-full" />
							<Skeleton className="h-4 w-2/3" />
						</CardHeader>
						<CardContent className="space-y-3 sm:space-y-4">
							<div className="space-y-1">
								<Skeleton className="h-3 sm:h-4 w-24" />
								<Skeleton className="h-3 sm:h-4 w-32" />
							</div>
							<div className="flex gap-2">
								<Skeleton className="h-9 sm:h-10 flex-1" />
								<Skeleton className="h-9 sm:h-10 flex-1" />
							</div>
						</CardContent>
					</Card>
				))}
			</div>
		</div>
	);
}
