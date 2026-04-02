import { Skeleton } from "@/components/ui/skeleton"

export default function ChatLoading() {
  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Chat panel */}
      <div className="flex flex-1 flex-col border-r">
        <div className="border-b p-4">
          <Skeleton className="h-6 w-48" />
        </div>
        <div className="flex-1 space-y-4 p-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className={`flex ${i % 2 === 0 ? "justify-end" : "justify-start"}`}>
              <Skeleton className={`h-16 rounded-lg ${i % 2 === 0 ? "w-2/3" : "w-3/4"}`} />
            </div>
          ))}
        </div>
        <div className="border-t p-4">
          <Skeleton className="h-12 w-full rounded-lg" />
        </div>
      </div>

      {/* Output panel */}
      <div className="hidden w-1/2 flex-col lg:flex">
        <div className="border-b p-4">
          <div className="flex gap-2">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-20" />
          </div>
        </div>
        <div className="flex-1 p-4 space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-4" style={{ width: `${60 + Math.random() * 40}%` }} />
          ))}
        </div>
      </div>
    </div>
  )
}
