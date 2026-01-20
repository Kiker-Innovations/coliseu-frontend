import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function HelpSkeleton() {
	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center gap-3">
				<Skeleton className="h-8 w-8" />
				<div>
					<Skeleton className="h-10 w-56" />
					<Skeleton className="h-5 w-96 mt-1" />
				</div>
			</div>

			{/* Search Card */}
			<Card>
				<CardContent className="pt-6">
					<Skeleton className="h-10 w-full" />
				</CardContent>
			</Card>

			{/* Help Sections */}
			{[...Array(8)].map((_, i) => (
				<Card key={i}>
					<CardHeader>
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-2">
								<Skeleton className="h-5 w-5" />
								<Skeleton className="h-6 w-40" />
							</div>
							<Skeleton className="h-5 w-5" />
						</div>
					</CardHeader>
				</Card>
			))}
		</div>
	);
}

