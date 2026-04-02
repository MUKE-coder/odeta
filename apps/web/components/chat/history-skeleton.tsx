"use client";

export function HistorySkeleton() {
  return (
    <div className="space-y-4 px-4 py-4">
      <div className="flex justify-end">
        <div className="h-10 w-48 bg-blue-100 rounded-2xl rounded-tr-sm animate-pulse" />
      </div>
      <div className="flex gap-3">
        <div className="w-7 h-7 rounded-full bg-gray-100 animate-pulse flex-shrink-0 mt-0.5" />
        <div className="flex-1 space-y-2 pt-1">
          <div className="h-4 bg-gray-100 rounded animate-pulse w-3/4" />
          <div className="h-4 bg-gray-100 rounded animate-pulse w-1/2" />
          <div className="h-16 bg-gray-100 rounded-xl animate-pulse w-full mt-3" />
        </div>
      </div>
      <div className="flex justify-end">
        <div className="h-8 w-32 bg-blue-100 rounded-2xl rounded-tr-sm animate-pulse" />
      </div>
      <div className="flex gap-3">
        <div className="w-7 h-7 rounded-full bg-gray-100 animate-pulse flex-shrink-0 mt-0.5" />
        <div className="flex-1 space-y-2 pt-1">
          <div className="h-4 bg-gray-100 rounded animate-pulse w-5/6" />
          <div className="h-4 bg-gray-100 rounded animate-pulse w-2/3" />
        </div>
      </div>
    </div>
  );
}
