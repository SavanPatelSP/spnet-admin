export const dynamic = "force-dynamic";

export default function AuditPage() {
  return (
    <div className="space-y-8">
      <div className="rounded-3xl border border-zinc-800 bg-gradient-to-r from-zinc-900 to-zinc-950 p-8">
        <h1 className="text-4xl font-black">
          Audit Configuration
        </h1>

        <p className="mt-3 text-zinc-400">
          Compliance, retention policies and audit exports.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
          <p className="text-zinc-500">Retention</p>
          <h2 className="mt-2 text-2xl font-bold">365 Days</h2>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
          <p className="text-zinc-500">Audit Logs</p>
          <h2 className="mt-2 text-2xl font-bold">Protected</h2>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
          <p className="text-zinc-500">Exports</p>
          <h2 className="mt-2 text-2xl font-bold">Enabled</h2>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
          <p className="text-zinc-500">Compliance</p>
          <h2 className="mt-2 text-2xl font-bold text-green-400">
            Healthy
          </h2>
        </div>
      </div>

      <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
        <div className="flex gap-3">
          <button className="rounded-xl bg-blue-600 px-4 py-2 text-white">
            Export Logs
          </button>

          <button className="rounded-xl bg-zinc-700 px-4 py-2 text-white">
            Download Report
          </button>
        </div>
      </div>
    </div>
  );
}
