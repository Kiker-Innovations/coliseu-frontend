import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function ConciergeSkeleton() {
	return (
		<div className="space-y-6">
			<div>
				<Skeleton className="h-8 w-48" />
				<Skeleton className="h-4 w-80 mt-2" />
			</div>

			<Card>
				<CardHeader>
					<CardTitle>
						<Skeleton className="h-6 w-56" />
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<Skeleton className="h-10 w-full" />
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<Skeleton className="h-24 w-full" />
						<Skeleton className="h-24 w-full" />
						<Skeleton className="h-24 w-full" />
						<Skeleton className="h-24 w-full" />
					</div>
				</CardContent>
			</Card>

			<div className="grid grid-cols-1 gap-4">
				{Array.from({ length: 3 }).map((_, i) => (
					<Card key={i}>
						<CardContent className="p-4 flex items-center justify-between">
							<div className="space-y-2">
								<Skeleton className="h-5 w-40" />
								<Skeleton className="h-4 w-64" />
							</div>
							<div className="flex gap-2">
								<Skeleton className="h-9 w-9" />
								<Skeleton className="h-9 w-9" />
								<Skeleton className="h-9 w-9" />
							</div>
						</CardContent>
					</Card>
				))}
			</div>
		</div>
	);
}
