import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function VotingSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Skeleton className="h-9 w-40 mb-2" />
        <Skeleton className="h-5 w-96" />
      </div>

      <Tabs defaultValue="view" className="space-y-6">
        <TabsList>
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24 ml-2" />
        </TabsList>

        <TabsContent value="view" className="space-y-6">
          {/* Active Votings */}
          <div>
            <Skeleton className="h-8 w-64 mb-4" />
            <div className="grid grid-cols-1 gap-4">
              {[1, 2].map((i) => (
                <Card key={i} className="border-2">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <Skeleton className="h-6 w-3/4 mb-2" />
                        <Skeleton className="h-4 w-full" />
                      </div>
                      <Skeleton className="h-6 w-16 rounded-full" />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-4">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-32" />
                    </div>

                    <div className="space-y-3">
                      {[1, 2].map((j) => (
                        <div key={j} className="space-y-1">
                          <div className="flex justify-between">
                            <Skeleton className="h-4 w-16" />
                            <Skeleton className="h-4 w-32" />
                          </div>
                          <Skeleton className="h-2 w-full" />
                        </div>
                      ))}
                    </div>

                    <div className="pt-2 border-t">
                      <Skeleton className="h-4 w-64" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Past Votings */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <Skeleton className="h-8 w-56" />
              <Skeleton className="h-10 w-[200px]" />
            </div>
            <div className="grid grid-cols-1 gap-4">
              {[1, 2].map((i) => (
                <Card key={i}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <Skeleton className="h-6 w-3/4 mb-2" />
                        <Skeleton className="h-4 w-1/2" />
                      </div>
                      <Skeleton className="h-6 w-20 rounded-full" />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      {[1, 2].map((j) => (
                        <div key={j} className="space-y-1">
                          <div className="flex justify-between">
                            <Skeleton className="h-4 w-16" />
                            <Skeleton className="h-4 w-32" />
                          </div>
                          <Skeleton className="h-2 w-full" />
                        </div>
                      ))}
                    </div>

                    <div className="pt-2 border-t">
                      <Skeleton className="h-4 w-64" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
