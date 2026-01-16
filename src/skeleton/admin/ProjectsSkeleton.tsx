import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProjectsSkeleton() {
	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex justify-between items-center">
				<div>
					<Skeleton className="h-9 w-48 mb-2" />
					<Skeleton className="h-5 w-80" />
				</div>
			</div>

			{/* Tabs */}
			<div className="space-y-6">
				<Skeleton className="h-10 w-80" />

				{/* Stats Cards */}
				<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
					{[...Array(3)].map((_, i) => (
						<Card key={i}>
							<CardContent className="pt-6">
								<div className="text-center space-y-2">
									<Skeleton className="h-4 w-24 mx-auto" />
									<Skeleton className="h-10 w-16 mx-auto" />
								</div>
							</CardContent>
						</Card>
					))}
				</div>

				{/* Project Cards */}
				<div className="space-y-4">
					{[...Array(3)].map((_, i) => (
						<Card key={i}>
							<CardHeader>
								<div className="flex items-start justify-between">
									<div className="flex-1 space-y-3">
										<div className="flex items-center gap-2">
											<Skeleton className="h-6 w-6 rounded-full" />
											<Skeleton className="h-6 w-48" />
										</div>
										<Skeleton className="h-4 w-full max-w-lg" />
									</div>
									<Skeleton className="h-8 w-24" />
								</div>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="flex items-center gap-4">
									<Skeleton className="h-4 w-24" />
									<Skeleton className="h-4 w-32" />
								</div>
								<Skeleton className="h-10 w-36" />
							</CardContent>
						</Card>
					))}
				</div>
			</div>
		</div>
	);
}
