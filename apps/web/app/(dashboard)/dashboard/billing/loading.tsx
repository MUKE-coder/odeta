import { Skeleton } from "@/components/ui/skeleton"

export default function BillingLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-4 w-64" />
      </div>

      {/* Current plan card */}
      <div className="rounded-lg border p-6 space-y-4">
        <Skeleton className="h-5 w-24" />
        <div className="flex items-end gap-2">
          <Skeleton className="h-10 w-16" />
          <Skeleton className="h-4 w-20" />
        </div>
        <Skeleton className="h-2 w-full rounded-full" />
        <Skeleton className="h-4 w-48" />
      </div>

      {/* Pricing cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-lg border p-6 space-y-4">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-10 w-20" />
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, j) => (
                <Skeleton key={j} className="h-4 w-full" />
              ))}
            </div>
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
      </div>
    </div>
  )
}
