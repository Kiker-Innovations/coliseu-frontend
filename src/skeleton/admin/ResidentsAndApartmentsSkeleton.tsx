import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function ResidentsAndApartmentsSkeleton() {
	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<Skeleton className="h-10 w-72" />
					<Skeleton className="h-5 w-96 mt-2" />
				</div>
			</div>

			{/* Tabs */}
			<Card>
				<CardContent className="pt-6">
					<div className="space-y-4">
						<Skeleton className="h-10 w-64" />
						
						{/* Search */}
						<div className="flex flex-col sm:flex-row gap-4">
							<Skeleton className="h-10 flex-1" />
							<Skeleton className="h-10 w-32" />
						</div>

						{/* Table */}
						<div className="space-y-2">
							<Skeleton className="h-12 w-full" />
							{[...Array(8)].map((_, i) => (
								<Skeleton key={i} className="h-16 w-full" />
							))}
						</div>

						{/* Pagination */}
						<div className="flex justify-between items-center">
							<Skeleton className="h-5 w-48" />
							<div className="flex gap-2">
								<Skeleton className="h-10 w-10" />
								<Skeleton className="h-10 w-10" />
								<Skeleton className="h-10 w-10" />
							</div>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}


