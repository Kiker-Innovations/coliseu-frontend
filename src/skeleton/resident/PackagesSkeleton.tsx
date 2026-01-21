import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function PackagesSkeleton() {
	return (
		<div className="space-y-4 sm:space-y-6">
			{/* Header */}
			<div className="space-y-1 sm:space-y-2">
				<Skeleton className="h-7 sm:h-9 w-48 sm:w-64" />
				<Skeleton className="h-4 sm:h-5 w-56 sm:w-72" />
			</div>

			{/* Stats Cards */}
			<div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
				{[...Array(3)].map((_, i) => (
					<Card key={i}>
						<CardContent className="pt-4 sm:pt-6">
							<div className="flex items-center justify-between">
								<div className="space-y-1 sm:space-y-2">
									<Skeleton className="h-3 sm:h-4 w-24 sm:w-32" />
									<Skeleton className="h-7 sm:h-9 w-12 sm:w-16" />
								</div>
								<Skeleton className="h-10 w-10 sm:h-12 sm:w-12 rounded-full" />
							</div>
						</CardContent>
					</Card>
				))}
			</div>

			{/* Main Card with Tabs */}
			<Card>
				<CardHeader className="pb-3 sm:pb-4">
					<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
						<Skeleton className="h-5 sm:h-6 w-36 sm:w-48" />
						<Skeleton className="h-9 sm:h-10 w-full sm:w-72" />
					</div>
				</CardHeader>
				<CardContent>
					{/* Tabs */}
					<Skeleton className="h-10 w-full max-w-md mb-4 sm:mb-6" />

					{/* Package Cards for Mobile */}
					<div className="space-y-3 sm:hidden">
						{[...Array(3)].map((_, i) => (
							<Card key={i} className="border-muted">
								<CardContent className="p-3 sm:p-4 space-y-2">
									<div className="flex items-start justify-between gap-2">
										<Skeleton className="h-5 flex-1 max-w-[60%]" />
										<Skeleton className="h-5 w-16 rounded-full" />
									</div>
									<Skeleton className="h-4 w-full" />
									<div className="flex justify-between items-center pt-2">
										<Skeleton className="h-3 w-24" />
										<Skeleton className="h-8 w-8 rounded-md" />
									</div>
								</CardContent>
							</Card>
						))}
					</div>

					{/* Table for Desktop */}
					<div className="hidden sm:block space-y-2">
						{[...Array(5)].map((_, i) => (
							<div key={i} className="flex items-center gap-4 p-3 rounded-md bg-muted/30">
								<Skeleton className="h-5 flex-1" />
								<Skeleton className="h-5 w-32" />
								<Skeleton className="h-5 w-24" />
								<Skeleton className="h-5 w-20" />
								<Skeleton className="h-8 w-8 rounded-md" />
						</div>
						))}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
