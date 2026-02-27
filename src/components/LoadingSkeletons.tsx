/**
 * Loading skeleton components for better perceived performance
 */

export function StatCardSkeleton() {
  return (
    <div className="bg-zinc-900 border border-white/10 rounded-xl p-6 animate-pulse">
      <div className="w-12 h-12 bg-zinc-800 rounded-xl mb-4" />
      <div className="h-8 bg-zinc-800 rounded w-24 mb-2" />
      <div className="h-4 bg-zinc-800 rounded w-32" />
    </div>
  );
}

export function ActivityItemSkeleton() {
  return (
    <div className="flex items-center gap-4 p-4 animate-pulse">
      <div className="w-10 h-10 bg-zinc-800 rounded-full flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-zinc-800 rounded w-3/4" />
        <div className="h-3 bg-zinc-800 rounded w-1/2" />
      </div>
    </div>
  );
}

export function MatchCardSkeleton() {
  return (
    <div className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-lg border border-white/5 animate-pulse">
      <div className="flex-1 space-y-2">
        <div className="h-5 bg-zinc-700 rounded w-32" />
        <div className="h-4 bg-zinc-700 rounded w-48" />
        <div className="flex gap-4">
          <div className="h-3 bg-zinc-700 rounded w-24" />
          <div className="h-3 bg-zinc-700 rounded w-24" />
        </div>
      </div>
      <div className="text-right space-y-2">
        <div className="h-6 bg-zinc-700 rounded w-24 ml-auto" />
        <div className="h-6 bg-zinc-700 rounded w-16 ml-auto" />
      </div>
    </div>
  );
}

export function TableRowSkeleton() {
  return (
    <tr className="border-b border-white/5 animate-pulse">
      <td className="px-6 py-4">
        <div className="h-4 bg-zinc-800 rounded w-24" />
      </td>
      <td className="px-6 py-4">
        <div className="h-4 bg-zinc-800 rounded w-32" />
      </td>
      <td className="px-6 py-4">
        <div className="h-4 bg-zinc-800 rounded w-20" />
      </td>
      <td className="px-6 py-4">
        <div className="h-4 bg-zinc-800 rounded w-16" />
      </td>
    </tr>
  );
}

export function ChartSkeleton() {
  // Use fixed widths instead of Math.random() to avoid hydration mismatch
  const widths = ['60%', '45%', '75%', '50%', '65%'];
  
  return (
    <div className="bg-zinc-900 border border-white/10 rounded-xl p-6">
      <div className="h-6 bg-zinc-800 rounded w-48 mb-6 animate-pulse" />
      <div className="space-y-4">
        {widths.map((width, i) => (
          <div key={i} className="flex items-center gap-4 animate-pulse">
            <div className="h-8 bg-zinc-800 rounded" style={{ width }} />
            <div className="h-4 bg-zinc-800 rounded w-12" />
          </div>
        ))}
      </div>
    </div>
  );
}
