export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      <div>
        <div className="skeleton-futuristic h-8 w-64" />
        <div className="skeleton-futuristic mt-2 h-4 w-48" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="skeleton-futuristic h-44" />
        ))}
      </div>
    </div>
  );
}
