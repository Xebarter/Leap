"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"

export function ReservationCardSkeleton() {
  return (
    <Card className="relative overflow-hidden border-2 animate-pulse">
      <div className="absolute inset-0 bg-gradient-to-br from-white/50 via-transparent to-transparent dark:from-white/5 pointer-events-none" />
      
      <CardContent className="p-6 relative">
        <div className="flex items-start gap-3 mb-4">
          <Skeleton className="h-14 w-14 rounded-xl flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-5 w-32" />
          </div>
        </div>

        <Separator className="my-4" />

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="rounded-lg border p-3 space-y-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-6 w-24" />
          </div>
          <div className="rounded-lg border p-3 space-y-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-4 w-20" />
          </div>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between p-2 rounded-lg">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-6 w-24" />
          </div>
          <div className="flex items-center justify-between p-2 rounded-lg">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-6 w-24" />
          </div>
        </div>

        <div className="space-y-2">
          <Skeleton className="h-10 w-full rounded-lg" />
          <div className="grid grid-cols-2 gap-2">
            <Skeleton className="h-8 w-full rounded-lg" />
            <Skeleton className="h-8 w-full rounded-lg" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function ReservationStatsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {[1, 2, 3, 4].map((i) => (
        <Card key={i} className="relative overflow-hidden border-2">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-16" />
              </div>
              <Skeleton className="h-14 w-14 rounded-xl" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export function ReservationPageSkeleton() {
  return (
    <div className="space-y-6">
      {/* Stats Skeleton */}
      <ReservationStatsSkeleton />

      {/* Search Skeleton */}
      <Card className="border-2">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <Skeleton className="h-11 flex-1" />
            <Skeleton className="h-11 w-full sm:w-[200px]" />
          </div>
        </CardContent>
      </Card>

      {/* Tabs Skeleton */}
      <div className="space-y-4">
        <Skeleton className="h-12 w-full rounded-lg" />
        
        {/* Cards Skeleton */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <ReservationCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  )
}
