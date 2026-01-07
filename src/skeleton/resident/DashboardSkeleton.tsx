import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardSkeleton() {
	return (
		<div className="space-y-6">
			<div className="flex justify-between items-center">
				<Skeleton className="h-10 w-64" />
				<Skeleton className="h-10 w-40" />
			</div>

			<Card>
				<CardHeader>
					<Skeleton className="h-6 w-96" />
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
						{[...Array(3)].map((_, i) => (
							<div key={i} className="p-6 rounded-lg bg-muted">
								<Skeleton className="h-12 w-12 mx-auto mb-4" />
								<Skeleton className="h-6 w-32 mx-auto mb-2" />
								<Skeleton className="h-8 w-24 mx-auto" />
							</div>
						))}
					</div>
				</CardContent>
			</Card>

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				<Card>
					<CardHeader>
						<Skeleton className="h-6 w-64" />
					</CardHeader>
					<CardContent>
						<div className="space-y-2">
							{[...Array(10)].map((_, i) => (
								<Skeleton key={i} className="h-12 w-full" />
							))}
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<Skeleton className="h-6 w-48" />
					</CardHeader>
					<CardContent className="space-y-4">
						<Skeleton className="h-20 w-full" />
						<Skeleton className="h-20 w-full" />
						<div className="space-y-3">
							{[...Array(3)].map((_, i) => (
								<Skeleton key={i} className="h-24 w-full" />
							))}
						</div>
						<Skeleton className="h-20 w-full" />
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
