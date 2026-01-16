import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function FinesSkeleton() {
	return (
		<div className="space-y-6">
			{/* Header */}
			<div>
				<Skeleton className="h-9 w-48 mb-2" />
				<Skeleton className="h-5 w-96" />
			</div>

			{/* Stats */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
				{[...Array(3)].map((_, i) => (
					<Card key={i}>
						<CardContent className="pt-6">
							<Skeleton className="h-4 w-32 mb-2 mx-auto" />
							<Skeleton className="h-10 w-20 mx-auto" />
						</CardContent>
					</Card>
				))}
			</div>

			{/* Fines List */}
			<div className="grid grid-cols-1 gap-4">
				{[...Array(3)].map((_, i) => (
					<Card key={i}>
						<CardHeader>
							<div className="flex items-start justify-between">
								<div className="flex-1 space-y-2">
									<Skeleton className="h-6 w-3/4" />
									<Skeleton className="h-4 w-full" />
									<Skeleton className="h-4 w-1/2" />
								</div>
								<Skeleton className="h-8 w-24" />
							</div>
						</CardHeader>
						<CardContent>
							<div className="flex gap-2">
								<Skeleton className="h-9 w-32" />
								<Skeleton className="h-9 w-32" />
							</div>
						</CardContent>
					</Card>
				))}
			</div>
		</div>
	);
}
