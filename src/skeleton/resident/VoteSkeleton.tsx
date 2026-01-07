import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function VoteSkeleton() {
	return (
		<div className="space-y-6">
			<Skeleton className="h-10 w-64 mb-6" />

			<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
				{[...Array(3)].map((_, i) => (
					<Card key={i}>
						<CardContent className="pt-6">
							<Skeleton className="h-24 w-full" />
						</CardContent>
					</Card>
				))}
			</div>

			<Card>
				<CardHeader>
					<Skeleton className="h-8 w-64" />
				</CardHeader>
				<CardContent>
					<Skeleton className="h-10 w-full mb-4" />
					<div className="space-y-4">
						{[...Array(4)].map((_, i) => (
							<Card key={i}>
								<CardContent className="pt-6">
									<Skeleton className="h-32 w-full" />
								</CardContent>
							</Card>
						))}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
