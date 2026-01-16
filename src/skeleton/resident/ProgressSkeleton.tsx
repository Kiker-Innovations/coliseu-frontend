import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProgressSkeleton() {
	return (
		<div className="space-y-6">
			<Skeleton className="h-10 w-64 mb-6" />

			<div className="space-y-6">
				{[...Array(3)].map((_, i) => (
					<Card key={i}>
						<CardHeader>
							<Skeleton className="h-6 w-48" />
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="flex justify-between items-center">
								<Skeleton className="h-5 w-32" />
								<Skeleton className="h-5 w-24" />
							</div>
							<Skeleton className="h-2 w-full" />
							<div className="grid grid-cols-3 gap-4">
								{[...Array(3)].map((_, j) => (
									<Skeleton key={j} className="h-16 w-full" />
								))}
							</div>
						</CardContent>
					</Card>
				))}
			</div>
		</div>
	);
}
