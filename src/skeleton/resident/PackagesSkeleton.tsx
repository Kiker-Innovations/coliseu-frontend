import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";

export default function PackagesSkeleton() {
	return (
		<div className="space-y-6">
			{/* Header */}
			<div>
				<Skeleton className="h-9 w-64 mb-2" />
				<Skeleton className="h-5 w-96" />
			</div>

			{/* Stats Cards */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
				{[1, 2, 3].map((i) => (
					<Card key={i}>
						<CardContent className="pt-6">
							<div className="flex items-center justify-between">
								<div className="space-y-2">
									<Skeleton className="h-4 w-32" />
									<Skeleton className="h-9 w-16" />
								</div>
								<Skeleton className="w-12 h-12 rounded-full" />
							</div>
						</CardContent>
					</Card>
				))}
			</div>

			{/* Main Content Card */}
			<Card>
				<CardHeader>
					<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
						<Skeleton className="h-7 w-48" />
						<Skeleton className="h-10 w-full sm:w-72" />
					</div>
				</CardHeader>
				<CardContent>
					{/* Tabs */}
					<div className="space-y-6">
						<Skeleton className="h-10 w-full max-w-md" />

						{/* Table */}
						<div className="rounded-md border">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>
											<Skeleton className="h-4 w-24" />
										</TableHead>
										<TableHead>
											<Skeleton className="h-4 w-32" />
										</TableHead>
										<TableHead>
											<Skeleton className="h-4 w-32" />
										</TableHead>
										<TableHead>
											<Skeleton className="h-4 w-24" />
										</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{[1, 2, 3, 4, 5].map((i) => (
										<TableRow key={i}>
											<TableCell>
												<Skeleton className="h-4 w-full mb-2" />
												<Skeleton className="h-3 w-48" />
											</TableCell>
											<TableCell>
												<Skeleton className="h-4 w-32" />
											</TableCell>
											<TableCell>
												<Skeleton className="h-4 w-28" />
											</TableCell>
											<TableCell>
												<Skeleton className="h-6 w-36" />
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

