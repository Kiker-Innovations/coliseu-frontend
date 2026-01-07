import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function PackagesSkeleton() {
	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div className="space-y-2">
					<Skeleton className="h-9 w-80" />
					<Skeleton className="h-5 w-64" />
				</div>
				<Skeleton className="h-11 w-48" />
			</div>

			{/* Stats Cards */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
				{[1, 2, 3].map((i) => (
					<Card key={i}>
						<CardContent className="pt-6">
							<div className="flex items-center justify-between">
								<div className="space-y-2">
									<Skeleton className="h-4 w-24" />
									<Skeleton className="h-9 w-16" />
								</div>
								<Skeleton className="h-12 w-12 rounded-full" />
							</div>
						</CardContent>
					</Card>
				))}
			</div>

			{/* Main Card */}
			<Card>
				<CardHeader>
					<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
						<Skeleton className="h-7 w-48" />
						<Skeleton className="h-10 w-full sm:w-72" />
					</div>
				</CardHeader>
				<CardContent>
					{/* Tabs */}
					<div className="space-y-6">
						<div className="flex gap-2">
							<Skeleton className="h-10 w-48" />
							<Skeleton className="h-10 w-48" />
						</div>

						{/* Table Skeleton */}
						<div className="rounded-md border">
							<div className="p-4">
								<div className="space-y-3">
									{[1, 2, 3, 4, 5].map((i) => (
										<div key={i} className="flex items-center gap-4">
											<Skeleton className="h-12 w-full" />
										</div>
									))}
								</div>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
