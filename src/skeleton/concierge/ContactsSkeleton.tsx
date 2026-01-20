import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function ContactsSkeleton() {
	return (
		<div className="space-y-6">
			{/* Header */}
			<div>
				<Skeleton className="h-10 w-48" />
				<Skeleton className="h-5 w-72 mt-2" />
			</div>

			{/* Search and Filter */}
			<div className="flex flex-col sm:flex-row gap-4">
				<Skeleton className="h-10 flex-1" />
				<Skeleton className="h-10 w-40" />
			</div>

			{/* Contacts Grid */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
				{[...Array(9)].map((_, i) => (
					<Card key={i}>
						<CardHeader>
							<div className="flex items-center gap-3">
								<Skeleton className="h-10 w-10 rounded-full" />
								<div className="flex-1">
									<Skeleton className="h-5 w-32" />
									<Skeleton className="h-4 w-24 mt-1" />
								</div>
							</div>
						</CardHeader>
						<CardContent>
							<div className="space-y-2">
								<div className="flex items-center gap-2">
									<Skeleton className="h-4 w-4" />
									<Skeleton className="h-4 w-36" />
								</div>
								<div className="flex items-center gap-2">
									<Skeleton className="h-4 w-4" />
									<Skeleton className="h-4 w-48" />
								</div>
							</div>
						</CardContent>
					</Card>
				))}
			</div>
		</div>
	);
}

