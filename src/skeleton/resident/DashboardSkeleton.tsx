import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardSkeleton() {
	return (
		<div className="space-y-4 sm:space-y-6">
			{/* Header */}
			<div className="flex justify-between items-center">
				<Skeleton className="h-8 sm:h-10 w-40 sm:w-64" />
			</div>

			{/* Podium */}
			<Card>
				<CardHeader className="pb-3 sm:pb-4">
					<Skeleton className="h-5 sm:h-6 w-48 sm:w-64" />
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
						{[...Array(3)].map((_, i) => (
							<div key={i} className="p-4 sm:p-6 rounded-lg bg-muted">
								<Skeleton className="h-10 sm:h-12 w-10 sm:w-12 mx-auto mb-2 sm:mb-4" />
								<Skeleton className="h-5 sm:h-6 w-24 sm:w-32 mx-auto mb-1 sm:mb-2" />
								<Skeleton className="h-7 sm:h-8 w-16 sm:w-24 mx-auto" />
							</div>
						))}
					</div>
				</CardContent>
			</Card>

			{/* Two Column Layout */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
				{/* Ranking */}
				<Card>
					<CardHeader className="pb-3 sm:pb-4">
						<Skeleton className="h-5 sm:h-6 w-40 sm:w-64" />
					</CardHeader>
					<CardContent>
						<div className="space-y-2 sm:space-y-3">
							{[...Array(5)].map((_, i) => (
								<div key={i} className="space-y-1.5 sm:space-y-2">
									<div className="flex justify-between items-center">
										<Skeleton className="h-4 sm:h-5 flex-1 max-w-[70%]" />
										<Skeleton className="h-4 sm:h-5 w-12" />
									</div>
									<Skeleton className="h-1.5 sm:h-2 w-full" />
								</div>
							))}
						</div>
					</CardContent>
				</Card>

				{/* Financial */}
				<Card>
					<CardHeader className="pb-3 sm:pb-4">
						<Skeleton className="h-5 sm:h-6 w-40 sm:w-48" />
					</CardHeader>
					<CardContent className="space-y-3 sm:space-y-4">
						<Skeleton className="h-16 sm:h-20 w-full rounded-lg" />
						<div className="grid grid-cols-2 gap-2">
							<Skeleton className="h-14 sm:h-16 w-full rounded-lg" />
							<Skeleton className="h-14 sm:h-16 w-full rounded-lg" />
						</div>
						<Skeleton className="h-14 sm:h-16 w-full rounded-lg" />
						<Skeleton className="h-16 sm:h-20 w-full rounded-lg" />
						<Skeleton className="h-16 sm:h-20 w-full rounded-lg" />
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
