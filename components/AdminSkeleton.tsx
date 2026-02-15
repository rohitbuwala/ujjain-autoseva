"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export default function AdminSkeleton() {
    return (
        <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-white px-4 py-10">
            {/* HEADER SKELETON */}
            <div className="max-w-7xl mx-auto mb-10 space-y-2">
                <Skeleton className="h-10 w-64 bg-slate-200 dark:bg-white/10" />
                <Skeleton className="h-4 w-48 bg-slate-100 dark:bg-white/5" />
            </div>

            {/* STATS SKELETON */}
            <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                {[1, 2, 3].map((i) => (
                    <Card key={i} className="bg-white dark:bg-black/40 border-slate-200 dark:border-white/10 p-6 flex items-center gap-5 overflow-hidden relative shadow-sm">
                        <Skeleton className="h-12 w-12 rounded-full bg-slate-200 dark:bg-white/10" />
                        <div className="space-y-2 flex-1">
                            <Skeleton className="h-3 w-20 bg-slate-100 dark:bg-white/5" />
                            <Skeleton className="h-8 w-12 bg-slate-200 dark:bg-white/10" />
                        </div>
                        <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
                    </Card>
                ))}
            </div>

            {/* QUICK ACTIONS SKELETON */}
            <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-5 mb-12">
                {[1, 2, 3].map((i) => (
                    <Card key={i} className="bg-white dark:bg-black/40 border-slate-200 dark:border-white/10 p-5 flex flex-col items-center gap-3 overflow-hidden relative shadow-sm">
                        <Skeleton className="h-8 w-8 bg-slate-200 dark:bg-white/10" />
                        <Skeleton className="h-4 w-32 bg-slate-100 dark:bg-white/5" />
                        <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
                    </Card>
                ))}
            </div>

            {/* TABLE SKELETON */}
            <div className="max-w-7xl mx-auto">
                <Skeleton className="h-8 w-40 bg-slate-200 dark:bg-white/10 mb-5" />
                <Card className="bg-white dark:bg-black/40 border-slate-200 dark:border-white/10 overflow-hidden relative shadow-sm">
                    <div className="p-4 space-y-4">
                        <div className="flex border-b border-slate-100 dark:border-white/10 pb-2">
                            {[1, 2, 3, 4].map((h) => <Skeleton key={h} className="h-4 flex-1 bg-slate-200 dark:bg-white/10 mx-2" />)}
                        </div>
                        {[1, 2, 3, 4, 5].map((r) => (
                            <div key={r} className="flex gap-4">
                                {[1, 2, 3, 4].map((c) => <Skeleton key={c} className="h-6 flex-1 bg-slate-100 dark:bg-white/5" />)}
                            </div>
                        ))}
                    </div>
                    <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
                </Card>
            </div>
        </div>
    );
}
