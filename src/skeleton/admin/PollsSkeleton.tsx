import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function PollsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Skeleton className="h-9 w-64 mb-2" />
        <Skeleton className="h-5 w-96" />
      </div>

      {/* Tabs */}
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />

        {/* Cards */}
        <div className="grid grid-cols-1 gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-3">
                    <Skeleton className="h-6 w-3/4" />
                    <div className="space-y-2">
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-1/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
