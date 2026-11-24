// Soft grey shapes shown while a page's data loads
export function FormSkeleton() {
  return (
    <div className="flex max-w-[480px] flex-col gap-[18px]" aria-hidden="true">
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="flex flex-col gap-1.5">
          <div className="h-4 w-24 animate-pulse rounded bg-brand-tint" />
          <div className="h-12 animate-pulse rounded-field bg-brand-tint" />
        </div>
      ))}
    </div>
  );
}

export function CardsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4" aria-hidden="true">
      {Array.from({ length: 8 }, (_, i) => (
        <div key={i} className="flex flex-col gap-2">
          <div className="aspect-[4/3] animate-pulse rounded-2xl bg-brand-tint" />
          <div className="h-4 w-3/4 animate-pulse rounded bg-brand-tint" />
        </div>
      ))}
    </div>
  );
}
