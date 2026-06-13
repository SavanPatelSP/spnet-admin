export default function PremiumPage() {
  return (
    <div className="space-y-8">

      <div>
        <h1 className="text-5xl font-black">
          Premium Center
        </h1>

        <p className="text-zinc-400 mt-2">
          Manage subscriptions and premium users
        </p>
      </div>

      <div className="grid md:grid-cols-4 gap-6">

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
          <p className="text-zinc-400">Premium Users</p>
          <h2 className="text-4xl font-black mt-2">3,142</h2>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
          <p className="text-zinc-400">New This Month</p>
          <h2 className="text-4xl font-black mt-2">428</h2>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
          <p className="text-zinc-400">Conversion Rate</p>
          <h2 className="text-4xl font-black mt-2">8.4%</h2>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
          <p className="text-zinc-400">MRR</p>
          <h2 className="text-4xl font-black mt-2">$28K</h2>
        </div>

      </div>

      <div className="rounded-3xl border border-zinc-800 bg-zinc-900 overflow-hidden">

        <table className="w-full">

          <thead className="bg-zinc-800/70">
            <tr>
              <th className="text-left p-4">Plan</th>
              <th className="text-left p-4">Users</th>
              <th className="text-left p-4">Revenue</th>
            </tr>
          </thead>

          <tbody>

            <tr className="border-t border-zinc-800">
              <td className="p-4">Monthly</td>
              <td className="p-4">2,100</td>
              <td className="p-4">$18K</td>
            </tr>

            <tr className="border-t border-zinc-800">
              <td className="p-4">Annual</td>
              <td className="p-4">1,042</td>
              <td className="p-4">$10K</td>
            </tr>

          </tbody>

        </table>

      </div>

    </div>
  );
}
