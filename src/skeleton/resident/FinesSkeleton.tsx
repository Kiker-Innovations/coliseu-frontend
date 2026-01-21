import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function FinesSkeleton() {
	return (
		<div className="space-y-4 sm:space-y-6">
			{/* Header */}
			<div className="space-y-1 sm:space-y-2">
				<Skeleton className="h-7 sm:h-9 w-36 sm:w-48" />
				<Skeleton className="h-4 sm:h-5 w-56 sm:w-72" />
			</div>

			{/* Active Fines Cards */}
			<div className="space-y-3 sm:space-y-4">
				{[...Array(2)].map((_, i) => (
					<Card key={i} className="overflow-hidden">
						<CardHeader className="pb-2 sm:pb-3">
							<div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-4">
								<div className="flex-1 min-w-0 space-y-2">
									<div className="flex items-center gap-2">
										<Skeleton className="h-4 w-4 sm:h-5 sm:w-5 rounded" />
										<Skeleton className="h-5 sm:h-6 flex-1 max-w-[60%]" />
										<Skeleton className="h-5 sm:h-6 w-16 sm:w-20 rounded-full" />
			</div>
									<Skeleton className="h-4 w-full max-w-[80%]" />
									<Skeleton className="h-3 sm:h-4 w-32 sm:w-40" />
								</div>
								<Skeleton className="h-7 sm:h-8 w-24 sm:w-32" />
							</div>
						</CardHeader>
						<CardContent className="pt-0">
							<div className="flex flex-col sm:flex-row gap-2">
								<Skeleton className="h-9 sm:h-10 flex-1" />
								<Skeleton className="h-9 sm:h-10 flex-1" />
							</div>
						</CardContent>
					</Card>
				))}
			</div>

			{/* History Section */}
			<Card>
				<CardHeader className="py-3 sm:py-4">
					<div className="flex items-center justify-between">
						<Skeleton className="h-5 sm:h-6 w-32 sm:w-40" />
						<Skeleton className="h-4 w-4 sm:h-5 sm:w-5" />
					</div>
				</CardHeader>
			</Card>
		</div>
	);
}
