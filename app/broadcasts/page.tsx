export default function BroadcastsPage() {
  return (
    <div className="space-y-8">

      <div>
        <h1 className="text-5xl font-black">
          Broadcast Center
        </h1>

        <p className="text-zinc-400 mt-2">
          Send announcements, campaigns and system notifications
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
          <p className="text-zinc-400">Broadcasts Sent</p>
          <h2 className="text-4xl font-black mt-2">284</h2>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
          <p className="text-zinc-400">Recipients</p>
          <h2 className="text-4xl font-black mt-2">48K</h2>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
          <p className="text-zinc-400">Delivery Rate</p>
          <h2 className="text-4xl font-black mt-2">99.2%</h2>
        </div>

      </div>

      <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">

        <h2 className="text-2xl font-bold mb-4">
          New Broadcast
        </h2>

        <input
          className="w-full rounded-xl bg-zinc-800 p-4 mb-4"
          placeholder="Broadcast title..."
        />

        <textarea
          className="w-full h-40 rounded-xl bg-zinc-800 p-4"
          placeholder="Write announcement..."
        />

        <button
          className="
            mt-4
            px-6
            py-3
            rounded-xl
            bg-blue-600
            hover:bg-blue-500
            transition-all
          "
        >
          Send Broadcast
        </button>

      </div>

    </div>
  );
}
