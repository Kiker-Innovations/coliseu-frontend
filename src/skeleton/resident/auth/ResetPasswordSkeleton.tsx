import { Skeleton } from "@/components/ui/skeleton";

export default function ResetPasswordSkeleton() {
	return (
		<div className="min-h-screen flex">
			<div className="hidden lg:flex lg:w-1/2 bg-primary items-center justify-center p-12">
				<div className="text-center">
					<Skeleton className="w-48 h-48 mx-auto rounded-full" />
					<Skeleton className="h-16 w-96 mx-auto mt-8" />
					<Skeleton className="h-6 w-64 mx-auto mt-4" />
				</div>
			</div>
			<div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-background">
				<div className="w-full max-w-md space-y-8">
					<div className="text-center space-y-4">
						<Skeleton className="w-16 h-16 mx-auto rounded-full" />
						<Skeleton className="h-10 w-48 mx-auto" />
						<Skeleton className="h-4 w-64 mx-auto" />
					</div>
					<div className="space-y-6">
						<div className="space-y-2">
							<Skeleton className="h-4 w-24" />
							<Skeleton className="h-12 w-full" />
						</div>
						<Skeleton className="h-12 w-full" />
						<Skeleton className="h-4 w-40 mx-auto" />
					</div>
				</div>
			</div>
		</div>
	);
}
