import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function NoticesSkeleton() {
	return (
		<div className="space-y-6">
			<Skeleton className="h-10 w-64 mb-6" />

			<div className="grid grid-cols-1 gap-4">
				{[...Array(5)].map((_, i) => (
					<Card key={i}>
						<CardHeader>
							<Skeleton className="h-6 w-3/4" />
							<Skeleton className="h-4 w-full mt-2" />
							<Skeleton className="h-4 w-2/3 mt-2" />
							<div className="flex items-center gap-4 mt-4">
								<Skeleton className="h-4 w-32" />
								<Skeleton className="h-5 w-16" />
							</div>
						</CardHeader>
						<CardContent>
							<div className="flex gap-2">
								<Skeleton className="h-9 w-24" />
								<Skeleton className="h-9 w-24" />
							</div>
						</CardContent>
					</Card>
				))}
			</div>
		</div>
	);
}
