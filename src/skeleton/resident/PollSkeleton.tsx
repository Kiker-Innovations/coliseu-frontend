import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function PollSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-10 w-40" />
      </div>

      <div className="space-y-6">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-64" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-10 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
