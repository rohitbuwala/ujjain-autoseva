import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function ServiceSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <Card key={i} className="flex flex-col h-full border-border/60 overflow-hidden">
          <CardHeader className="space-y-3">
            <div className="flex justify-between items-start gap-2">
              {/* Title Skeleton */}
              <Skeleton className="h-6 w-3/4 bg-muted/80 rounded-md" />
              {/* Save Amount Badge Skeleton */}
              <Skeleton className="h-5 w-16 bg-primary/10 rounded" />
            </div>
            {/* Time Skeleton */}
            <Skeleton className="h-4 w-1/2 bg-muted/60 rounded" />
          </CardHeader>

          <CardContent className="mt-auto space-y-4 pt-0">
            <div className="flex items-end gap-2 mb-2">
              {/* Price Skeleton */}
              <Skeleton className="h-8 w-20 bg-primary/20 rounded" />
              {/* Original Price Skeleton */}
              <Skeleton className="h-4 w-12 bg-muted/40 rounded" />
            </div>
            {/* Button Skeleton */}
            <Skeleton className="h-10 w-full rounded-md bg-primary/20" />
          </CardContent>

          {/* Shimmer effect overlay - if using raw CSS animations, otherwise rely on shadcn skeleton pulse */}
          <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
        </Card>
      ))}
    </div>
  );
}
