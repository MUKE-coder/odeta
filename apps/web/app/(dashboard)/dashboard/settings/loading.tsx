import { Skeleton } from "@/components/ui/skeleton"

export default function SettingsLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-4 w-64" />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b pb-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-24 rounded-md" />
        ))}
      </div>

      {/* Form fields */}
      <div className="space-y-6 max-w-2xl">
        {/* Avatar */}
        <div className="flex items-center gap-4">
          <Skeleton className="h-16 w-16 rounded-full" />
          <Skeleton className="h-9 w-32" />
        </div>

        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}

        <Skeleton className="h-10 w-32" />
      </div>
    </div>
  )
}
