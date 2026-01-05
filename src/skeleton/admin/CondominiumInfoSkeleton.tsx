import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function CondominiumInfoSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Skeleton className="h-9 w-64 mb-2" />
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
                  <Skeleton className="h-8 w-16 mb-2" />
                  <Skeleton className="h-3 w-32" />
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Common Areas */}
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="p-4 rounded-lg bg-muted/50">
                  <Skeleton className="h-5 w-48 mb-2" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <div className="flex gap-4">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Residents Table */}
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
