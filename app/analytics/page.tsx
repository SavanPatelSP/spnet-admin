import RevenueChart from "@/components/dashboard/RevenueChart";

export default function AnalyticsPage() {
  return (
    <div className="space-y-8">

      <div>
        <h1 className="text-5xl font-black">
          Analytics Center
        </h1>

        <p className="text-zinc-400 mt-2">
          Monitor growth, revenue and engagement
        </p>
      </div>

      <div className="grid md:grid-cols-4 gap-6">

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
          <p className="text-zinc-400">
            Daily Active Users
          </p>

          <h2 className="text-4xl font-black mt-2">
            12.4K
          </h2>

          <p className="text-green-400 mt-2">
            +12%
          </p>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
          <p className="text-zinc-400">
            Monthly Active Users
          </p>

          <h2 className="text-4xl font-black mt-2">
            48.2K
          </h2>

          <p className="text-green-400 mt-2">
            +18%
          </p>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
          <p className="text-zinc-400">
            Premium Users
          </p>

          <h2 className="text-4xl font-black mt-2">
            3.1K
          </h2>

          <p className="text-green-400 mt-2">
            +9%
          </p>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
          <p className="text-zinc-400">
            Revenue
          </p>

          <h2 className="text-4xl font-black mt-2">
            $42K
          </h2>

          <p className="text-green-400 mt-2">
            +22%
          </p>
        </div>

      </div>

      <RevenueChart />

      <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">

        <h2 className="text-2xl font-bold mb-4">
          Performance Summary
        </h2>

        <div className="space-y-3">

          <div className="flex justify-between">
            <span>User Growth</span>
            <span className="text-green-400">
              +12%
            </span>
          </div>

          <div className="flex justify-between">
            <span>Premium Growth</span>
            <span className="text-green-400">
              +9%
            </span>
          </div>

          <div className="flex justify-between">
            <span>Revenue Growth</span>
            <span className="text-green-400">
              +22%
            </span>
          </div>

        </div>

      </div>

    </div>
  );
}
