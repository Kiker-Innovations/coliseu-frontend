import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProfileSkeleton() {
	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center gap-4">
				<Skeleton className="h-10 w-10" />
				<div>
					<Skeleton className="h-10 w-40" />
					<Skeleton className="h-5 w-64 mt-1" />
				</div>
			</div>

			<div className="grid gap-6 md:grid-cols-3">
				{/* Profile Card */}
				<Card className="md:col-span-1">
					<CardHeader>
						<div className="flex flex-col items-center gap-4">
							<Skeleton className="h-24 w-24 rounded-full" />
							<Skeleton className="h-6 w-40" />
						</div>
					</CardHeader>
					<CardContent>
						<div className="space-y-3">
							<div className="flex items-center gap-3">
								<Skeleton className="h-4 w-4" />
								<Skeleton className="h-4 w-48" />
							</div>
							<div className="flex items-center gap-3">
								<Skeleton className="h-4 w-4" />
								<Skeleton className="h-4 w-36" />
							</div>
							<div className="flex items-center gap-3">
								<Skeleton className="h-4 w-4" />
								<Skeleton className="h-4 w-32" />
							</div>
						</div>
					</CardContent>
				</Card>

				{/* Edit Card */}
				<Card className="md:col-span-2">
					<CardHeader>
						<Skeleton className="h-6 w-48" />
						<Skeleton className="h-4 w-72 mt-1" />
					</CardHeader>
					<CardContent>
						<div className="space-y-6">
							<div className="space-y-2">
								<Skeleton className="h-4 w-32" />
								<Skeleton className="h-10 w-full" />
							</div>
							<div className="space-y-2">
								<Skeleton className="h-4 w-24" />
								<Skeleton className="h-10 w-full" />
							</div>
							<div className="space-y-2">
								<Skeleton className="h-4 w-28" />
								<Skeleton className="h-10 w-full" />
							</div>
							<div className="flex justify-end gap-3">
								<Skeleton className="h-10 w-24" />
								<Skeleton className="h-10 w-36" />
							</div>
						</div>
					</CardContent>
				</Card>

				{/* Password Card */}
				<Card className="md:col-span-3">
					<CardHeader>
						<Skeleton className="h-6 w-36" />
						<Skeleton className="h-4 w-64 mt-1" />
					</CardHeader>
					<CardContent>
						<div className="space-y-6">
							<div className="space-y-2">
								<Skeleton className="h-4 w-32" />
								<Skeleton className="h-10 w-full" />
							</div>
							<div className="space-y-2">
								<Skeleton className="h-4 w-28" />
								<Skeleton className="h-10 w-full" />
								<Skeleton className="h-3 w-96" />
							</div>
							<div className="space-y-2">
								<Skeleton className="h-4 w-48" />
								<Skeleton className="h-10 w-full" />
							</div>
							<div className="flex justify-end gap-3">
								<Skeleton className="h-10 w-24" />
								<Skeleton className="h-10 w-32" />
							</div>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}

