// import SettingsStats from "./components/SettingsStats";

export default function SettingsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold">
          Enterprise Settings Center
        </h1>

        <p className="mt-2 text-zinc-500">
          Security, access control, licensing and platform administration.
        </p>
      </div>

{/* <SettingsStats /> */}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold">
              Team Members
            </h2>

            <button className="rounded-xl bg-blue-600 px-4 py-2 text-sm text-white">
              Add Member
            </button>
          </div>

          <div className="rounded-xl border border-zinc-800 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">
                  Savan Patel
                </p>

                <p className="text-sm text-zinc-500">
                  admin@spnet.local
                </p>
              </div>

              <span className="rounded-full bg-red-500/10 px-3 py-1 text-xs text-red-400">
                OWNER
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold">
              Roles & Permissions
            </h2>

            <button className="rounded-xl bg-blue-600 px-4 py-2 text-sm text-white">
              Create Role
            </button>
          </div>

          <div className="space-y-3">
            <div className="rounded-xl border border-zinc-800 p-4">
              OWNER
            </div>

            <div className="rounded-xl border border-zinc-800 p-4">
              SUPER_ADMIN
            </div>

            <div className="rounded-xl border border-zinc-800 p-4">
              ADMIN
            </div>

            <div className="rounded-xl border border-zinc-800 p-4">
              VIEWER
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
          <h2 className="mb-4 text-xl font-semibold">
            Security Center
          </h2>

          <div className="space-y-4">
            <label className="flex items-center gap-3">
              <input type="checkbox" defaultChecked />
              <span>Audit Logging</span>
            </label>

            <label className="flex items-center gap-3">
              <input type="checkbox" defaultChecked />
              <span>MFA Enforcement</span>
            </label>

            <label className="flex items-center gap-3">
              <input type="checkbox" defaultChecked />
              <span>Session Timeout</span>
            </label>

            <label className="flex items-center gap-3">
              <input type="checkbox" defaultChecked />
              <span>IP Allowlist</span>
            </label>

            <label className="flex items-center gap-3">
              <input type="checkbox" defaultChecked />
              <span>Rate Limiting</span>
            </label>

            <label className="flex items-center gap-3">
              <input type="checkbox" defaultChecked />
              <span>Device Fingerprinting</span>
            </label>

            <label className="flex items-center gap-3">
              <input type="checkbox" defaultChecked />
              <span>Emergency Lockdown</span>
            </label>
          </div>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
          <h2 className="mb-4 text-xl font-semibold">
            License Defaults
          </h2>

          <div className="space-y-4">
            <input
              defaultValue="5"
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950 p-3"
              placeholder="Default Device Limit"
            />

            <input
              defaultValue="365"
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950 p-3"
              placeholder="Default License Duration"
            />

            <input
              defaultValue="30"
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950 p-3"
              placeholder="Grace Period Days"
            />
          </div>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6 lg:col-span-2">
          <h2 className="mb-4 text-xl font-semibold text-red-400">
            Danger Zone
          </h2>

          <div className="flex flex-wrap gap-3">
            <button className="rounded-xl bg-red-600 px-4 py-2 text-white">
              Emergency Lockdown
            </button>

            <button className="rounded-xl bg-yellow-600 px-4 py-2 text-white">
              Force Logout All Sessions
            </button>

            <button className="rounded-xl bg-zinc-700 px-4 py-2 text-white">
              Export Audit Logs
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
