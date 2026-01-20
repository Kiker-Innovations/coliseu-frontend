import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function SuggestionsSkeleton() {
	return (
		<div className="space-y-4 sm:space-y-6">
			{/* Header */}
			<div className="space-y-3 sm:space-y-0 sm:flex sm:justify-between sm:items-start sm:gap-4">
				<div className="flex-1 min-w-0 space-y-2">
					<Skeleton className="h-8 sm:h-10 w-48 sm:w-64" />
					<Skeleton className="h-4 sm:h-5 w-36 sm:w-48" />
				</div>
				<div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
					<Skeleton className="h-10 w-full sm:w-[180px]" />
					<Skeleton className="h-10 w-full sm:w-36" />
				</div>
			</div>

			{/* Cards */}
			<div className="grid gap-3 sm:gap-4">
				{[...Array(3)].map((_, i) => (
					<Card key={i} className="overflow-hidden">
						<CardHeader className="pb-2 sm:pb-3">
							<div className="flex justify-between items-start gap-2">
								<Skeleton className="h-5 sm:h-6 flex-1 max-w-[70%]" />
								<div className="flex gap-1 sm:gap-2 shrink-0">
									<Skeleton className="h-8 w-8 sm:h-9 sm:w-9 rounded-md" />
									<Skeleton className="h-8 w-8 sm:h-9 sm:w-9 rounded-md" />
								</div>
							</div>
						</CardHeader>
						<CardContent className="pt-0 space-y-2">
							<Skeleton className="h-4 w-full" />
							<Skeleton className="h-4 w-full" />
							<Skeleton className="h-4 w-3/4" />
						</CardContent>
					</Card>
				))}
			</div>
		</div>
	);
}
