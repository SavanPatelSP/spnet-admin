export default function SecurityPage() {
  return (
    <div className="space-y-8">

      <div>
        <h1 className="text-5xl font-black">
          Security Center
        </h1>

        <p className="text-zinc-400 mt-2">
          Monitor platform security and threats
        </p>
      </div>

      <div className="grid md:grid-cols-4 gap-6">

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
          <p className="text-zinc-400">Threats Blocked</p>
          <h2 className="text-4xl font-black mt-2">1248</h2>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
          <p className="text-zinc-400">Open Alerts</p>
          <h2 className="text-4xl font-black mt-2">4</h2>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
          <p className="text-zinc-400">Banned Accounts</p>
          <h2 className="text-4xl font-black mt-2">97</h2>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
          <p className="text-zinc-400">Security Score</p>
          <h2 className="text-4xl font-black mt-2">98%</h2>
        </div>

      </div>

      <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">

        <h2 className="text-2xl font-bold mb-4">
          Recent Security Events
        </h2>

        <div className="space-y-3">

          <div className="flex justify-between">
            <span>Spam attack blocked</span>
            <span className="text-zinc-500">5m ago</span>
          </div>

          <div className="flex justify-between">
            <span>Account suspended</span>
            <span className="text-zinc-500">18m ago</span>
          </div>

          <div className="flex justify-between">
            <span>New login detected</span>
            <span className="text-zinc-500">27m ago</span>
          </div>

        </div>

      </div>

    </div>
  );
}
