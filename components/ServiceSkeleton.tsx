import { Skeleton } from "@/components/ui/skeleton";

export default function ServiceSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

      {[1,2,3,4,5,6].map((i) => (

        <div
          key={i}
          className="card-safe p-4 space-y-3"
        >

          {/* Title */}
          <Skeleton className="h-5 w-3/4 bg-white/10 animate-pulse" />

          {/* Time */}
          <Skeleton className="h-4 w-1/2 bg-white/10 animate-pulse" />

          {/* Price */}
          <Skeleton className="h-4 w-1/3 bg-white/10 animate-pulse" />

          {/* Button */}
          <Skeleton className="h-9 w-full rounded-md bg-white/10 animate-pulse" />

        </div>

      ))}

    </div>
  );
}
