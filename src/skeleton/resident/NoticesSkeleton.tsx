import { Card, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function NoticesSkeleton() {
	return (
		<div className="space-y-4 sm:space-y-6">
			{/* Header */}
			<div className="space-y-1 sm:space-y-2">
				<Skeleton className="h-7 sm:h-9 w-24 sm:w-32" />
				<Skeleton className="h-4 sm:h-5 w-48 sm:w-64" />
			</div>

			{/* Notice Cards */}
			<div className="grid grid-cols-1 gap-3 sm:gap-4">
				{[...Array(5)].map((_, i) => (
					<Card key={i} className="overflow-hidden">
						<CardHeader className="pb-2 sm:pb-3">
							<div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
								<div className="flex-1 min-w-0 space-y-2">
									<div className="flex items-center gap-2">
										<Skeleton className="h-4 w-4 sm:h-5 sm:w-5 rounded" />
										<Skeleton className="h-5 sm:h-6 flex-1 max-w-[70%]" />
									</div>
									<div className="flex flex-wrap items-center gap-2 sm:gap-4">
										<Skeleton className="h-3 sm:h-4 w-24 sm:w-32" />
										<Skeleton className="h-5 sm:h-6 w-14 sm:w-16 rounded-full" />
									</div>
								</div>
								<div className="flex gap-2 shrink-0">
									<Skeleton className="h-8 w-8 sm:h-9 sm:w-9 rounded-md" />
									<Skeleton className="h-8 w-8 sm:h-9 sm:w-9 rounded-md" />
								</div>
							</div>
						</CardHeader>
					</Card>
				))}
			</div>

			{/* Pagination */}
			<div className="flex justify-center">
				<div className="flex items-center gap-1 sm:gap-2">
					<Skeleton className="h-8 sm:h-9 w-16 sm:w-20 rounded-md" />
					<Skeleton className="h-8 sm:h-9 w-8 sm:w-10 rounded-md" />
					<Skeleton className="h-8 sm:h-9 w-8 sm:w-10 rounded-md" />
					<Skeleton className="h-8 sm:h-9 w-8 sm:w-10 rounded-md" />
					<Skeleton className="h-8 sm:h-9 w-16 sm:w-20 rounded-md" />
				</div>
			</div>
		</div>
	);
}
