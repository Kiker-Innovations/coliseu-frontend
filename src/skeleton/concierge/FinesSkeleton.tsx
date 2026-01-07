import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function FinesSkeleton() {
	return (
		<div className="space-y-6">
			{/* Header */}
			<div>
				<Skeleton className="h-9 w-64 mb-2" />
				<Skeleton className="h-5 w-96" />
			</div>

			{/* Table Card */}
			<Card>
				<CardHeader>
					<Skeleton className="h-6 w-48" />
				</CardHeader>
				<CardContent>
					<div className="space-y-3">
						{/* Table Header */}
						<div className="grid grid-cols-12 gap-4 pb-3 border-b">
							<Skeleton className="h-4 w-full col-span-2" />
							<Skeleton className="h-4 w-full col-span-3" />
							<Skeleton className="h-4 w-full col-span-3" />
							<Skeleton className="h-4 w-full col-span-4" />
						</div>

						{/* Table Rows */}
						{[...Array(8)].map((_, i) => (
							<div key={i} className="grid grid-cols-12 gap-4 py-3 border-b">
								<Skeleton className="h-4 w-full col-span-2" />
								<Skeleton className="h-4 w-full col-span-3" />
								<Skeleton className="h-4 w-full col-span-3" />
								<div className="col-span-4 flex gap-2">
									<Skeleton className="h-9 w-24" />
									<Skeleton className="h-9 w-24" />
								</div>
							</div>
						))}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
