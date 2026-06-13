export default function OwnerPage() {
  return (
    <div className="space-y-8">

      <div>
        <h1 className="text-3xl font-bold">
          Owner Control Center
        </h1>

        <p className="text-zinc-500 mt-2">
          Manage roles, licenses, security and team members.
        </p>
      </div>

      <div className="grid md:grid-cols-4 gap-6">

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
          <h3 className="font-semibold">
            Roles
          </h3>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
          <h3 className="font-semibold">
            Security Policies
          </h3>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
          <h3 className="font-semibold">
            Team Members
          </h3>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
          <h3 className="font-semibold">
            License Management
          </h3>
        </div>

      </div>

    </div>
  );
}
