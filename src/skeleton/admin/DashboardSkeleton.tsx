import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardSkeleton() {
	return (
		<div className="space-y-6">
			<div className="flex justify-between items-center">
				<Skeleton className="h-10 w-64" />
				<Skeleton className="h-10 w-40" />
			</div>

			<Card className="border-2">
				<CardHeader>
					<Skeleton className="h-8 w-72" />
				</CardHeader>
				<CardContent className="pt-6">
					<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
						{[...Array(3)].map((_, i) => (
							<Skeleton key={i} className="h-28 w-full" />
						))}
					</div>
					<div className="space-y-3">
						<Skeleton className="h-6 w-48" />
						{[...Array(3)].map((_, i) => (
							<Skeleton key={i} className="h-40 w-full" />
						))}
					</div>
					<Skeleton className="h-20 w-full mt-6" />
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<Skeleton className="h-6 w-96" />
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
						{[...Array(3)].map((_, i) => (
							<Skeleton key={i} className="h-32 w-full" />
						))}
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<Skeleton className="h-6 w-72" />
				</CardHeader>
				<CardContent>
					<div className="space-y-2">
						{[...Array(10)].map((_, i) => (
							<Skeleton key={i} className="h-12 w-full" />
						))}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
