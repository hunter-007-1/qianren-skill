"use client";

/**
 * 骨架屏组件
 */
interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = "" }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-slate-200 dark:bg-slate-700 ${className}`}
      aria-hidden="true"
    />
  );
}

/**
 * 角色卡片骨架屏
 */
export function CharacterCardSkeleton() {
  return (
    <div className="flex flex-col rounded-[2.5rem] border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center gap-5">
        <Skeleton className="h-16 w-16 rounded-2xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <Skeleton className="mt-6 h-8 w-full rounded-full" />
      <div className="mt-6 grid grid-cols-2 gap-3">
        <Skeleton className="h-12 rounded-2xl" />
        <Skeleton className="h-12 rounded-2xl" />
      </div>
    </div>
  );
}

/**
 * 消息骨架屏
 */
export function MessageSkeleton() {
  return (
    <div className="flex items-start gap-4">
      <Skeleton className="h-10 w-10 rounded-2xl" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-20 w-3/4 rounded-[1.5rem]" />
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
  );
}

/**
 * 分析结果骨架屏
 */
export function AnalysisCardSkeleton() {
  return (
    <div className="rounded-[2.5rem] bg-white border border-slate-200 p-8 dark:bg-slate-900 dark:border-slate-800">
      <div className="flex items-center gap-4">
        <Skeleton className="h-12 w-12 rounded-2xl" />
        <Skeleton className="h-6 flex-1" />
      </div>
      <div className="mt-6 space-y-4">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-4/6" />
      </div>
    </div>
  );
}