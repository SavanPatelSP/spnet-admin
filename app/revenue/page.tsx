export default function RevenuePage() {
  return (
    <div className="space-y-8">

      <div>
        <h1 className="text-5xl font-black">
          Revenue Center
        </h1>

        <p className="text-zinc-400 mt-2">
          Track revenue and financial performance
        </p>
      </div>

      <div className="grid md:grid-cols-4 gap-6">

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
          <p className="text-zinc-400">Today's Revenue</p>
          <h2 className="text-4xl font-black mt-2">$1,240</h2>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
          <p className="text-zinc-400">Weekly Revenue</p>
          <h2 className="text-4xl font-black mt-2">$8,920</h2>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
          <p className="text-zinc-400">Monthly Revenue</p>
          <h2 className="text-4xl font-black mt-2">$42,100</h2>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
          <p className="text-zinc-400">Annual Revenue</p>
          <h2 className="text-4xl font-black mt-2">$510K</h2>
        </div>

      </div>

      <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">

        <h2 className="text-2xl font-bold mb-4">
          Revenue Sources
        </h2>

        <div className="space-y-4">

          <div className="flex justify-between">
            <span>Premium Subscriptions</span>
            <span>$28,400</span>
          </div>

          <div className="flex justify-between">
            <span>In-App Purchases</span>
            <span>$10,800</span>
          </div>

          <div className="flex justify-between">
            <span>Advertising</span>
            <span>$2,900</span>
          </div>

        </div>

      </div>

    </div>
  );
}
