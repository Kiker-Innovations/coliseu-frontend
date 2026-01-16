import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function FinancialSkeleton() {
	return (
		<div className="space-y-6">
			{/* Header */}
			<div>
				<Skeleton className="h-9 w-48 mb-2" />
				<Skeleton className="h-5 w-96" />
			</div>

			<Tabs defaultValue="view" className="space-y-6">
				<TabsList>
					<Skeleton className="h-10 w-24" />
					<Skeleton className="h-10 w-24 ml-2" />
				</TabsList>

				<TabsContent value="view" className="space-y-6">
					{/* Summary Cards */}
					<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
						{[1, 2, 3].map((i) => (
							<Card key={i}>
								<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
									<Skeleton className="h-4 w-32" />
									<Skeleton className="h-4 w-4 rounded" />
								</CardHeader>
								<CardContent>
									<Skeleton className="h-8 w-32 mb-2" />
									<Skeleton className="h-3 w-40" />
								</CardContent>
							</Card>
						))}
					</div>

					{/* Approved Suggestions */}
					<Card>
						<CardHeader>
							<Skeleton className="h-6 w-64" />
						</CardHeader>
						<CardContent className="space-y-4">
							{[1, 2, 3].map((i) => (
								<div key={i} className="space-y-2">
									<div className="flex justify-between items-center">
										<Skeleton className="h-5 w-48" />
										<Skeleton className="h-5 w-24" />
									</div>
									<Skeleton className="h-2 w-full" />
								</div>
							))}
						</CardContent>
					</Card>

					{/* Monthly Expenses */}
					<Card>
						<CardHeader>
							<Skeleton className="h-6 w-64" />
						</CardHeader>
						<CardContent className="space-y-4">
							{[1, 2, 3, 4, 5].map((i) => (
								<div
									key={i}
									className="flex justify-between items-center p-3 rounded-lg bg-muted/50"
								>
									<Skeleton className="h-5 w-32" />
									<Skeleton className="h-6 w-24" />
								</div>
							))}
							<div className="flex justify-between items-center p-3 rounded-lg">
								<Skeleton className="h-6 w-16" />
								<Skeleton className="h-7 w-32" />
							</div>
						</CardContent>
					</Card>

					{/* Cash Analysis */}
					<Card>
						<CardHeader>
							<Skeleton className="h-6 w-48" />
						</CardHeader>
						<CardContent>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								{[1, 2].map((i) => (
									<div key={i} className="p-4 rounded-lg">
										<Skeleton className="h-4 w-40 mb-2" />
										<Skeleton className="h-8 w-32" />
									</div>
								))}
							</div>
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	);
}
