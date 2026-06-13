export default function SecurityPoliciesPage() {
  return (
    <div className="space-y-6">

      <div>
        <h1 className="text-3xl font-bold">
          Security Policies
        </h1>

        <p className="text-zinc-500 mt-2">
          Configure license revalidation requirements for each role.
        </p>
      </div>

      <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">

        <table className="w-full">

          <thead className="border-b border-zinc-800">

            <tr>

              <th className="text-left py-4">
                Role
              </th>

              <th className="text-left py-4">
                Security Level
              </th>

              <th className="text-left py-4">
                Revalidate Every
              </th>

            </tr>

          </thead>

          <tbody>

            <tr className="border-b border-zinc-800">
              <td className="py-4">OWNER</td>

              <td className="py-4">
                <span className="px-2 py-1 rounded-full bg-red-500/10 text-red-400 text-xs">
                  HIGH
                </span>
              </td>

              <td className="py-4">
                <select className="bg-zinc-800 rounded-lg px-3 py-2">
                  <option>7 Days</option>
                  <option>14 Days</option>
                  <option>30 Days</option>
                  <option>90 Days</option>
                </select>
              </td>
            </tr>

            <tr className="border-b border-zinc-800">
              <td className="py-4">SUPER_ADMIN</td>

              <td className="py-4">
                <span className="px-2 py-1 rounded-full bg-red-500/10 text-red-400 text-xs">
                  HIGH
                </span>
              </td>

              <td className="py-4">
                <select className="bg-zinc-800 rounded-lg px-3 py-2">
                  <option>7 Days</option>
                  <option>14 Days</option>
                  <option>30 Days</option>
                  <option>90 Days</option>
                </select>
              </td>
            </tr>

            <tr className="border-b border-zinc-800">
              <td className="py-4">DEVELOPER</td>

              <td className="py-4">
                <span className="px-2 py-1 rounded-full bg-red-500/10 text-red-400 text-xs">
                  HIGH
                </span>
              </td>

              <td className="py-4">
                <select className="bg-zinc-800 rounded-lg px-3 py-2">
                  <option>7 Days</option>
                  <option>14 Days</option>
                  <option>30 Days</option>
                  <option>90 Days</option>
                </select>
              </td>
            </tr>

            <tr className="border-b border-zinc-800">
              <td className="py-4">BILLING_MANAGER</td>

              <td className="py-4">
                <span className="px-2 py-1 rounded-full bg-red-500/10 text-red-400 text-xs">
                  HIGH
                </span>
              </td>

              <td className="py-4">
                <select className="bg-zinc-800 rounded-lg px-3 py-2">
                  <option>7 Days</option>
                  <option>14 Days</option>
                  <option>30 Days</option>
                  <option>90 Days</option>
                </select>
              </td>
            </tr>

            <tr className="border-b border-zinc-800">
              <td className="py-4">COMMUNITY_MANAGER</td>

              <td className="py-4">
                <span className="px-2 py-1 rounded-full bg-yellow-500/10 text-yellow-400 text-xs">
                  STANDARD
                </span>
              </td>

              <td className="py-4">
                <select className="bg-zinc-800 rounded-lg px-3 py-2">
                  <option>14 Days</option>
                  <option>30 Days</option>
                  <option>60 Days</option>
                  <option>90 Days</option>
                </select>
              </td>
            </tr>

            <tr className="border-b border-zinc-800">
              <td className="py-4">SUPPORT_MANAGER</td>

              <td className="py-4">
                <span className="px-2 py-1 rounded-full bg-yellow-500/10 text-yellow-400 text-xs">
                  STANDARD
                </span>
              </td>

              <td className="py-4">
                <select className="bg-zinc-800 rounded-lg px-3 py-2">
                  <option>14 Days</option>
                  <option>30 Days</option>
                  <option>60 Days</option>
                  <option>90 Days</option>
                </select>
              </td>
            </tr>

            <tr className="border-b border-zinc-800">
              <td className="py-4">SUPPORT_AGENT</td>

              <td className="py-4">
                <span className="px-2 py-1 rounded-full bg-green-500/10 text-green-400 text-xs">
                  RELAXED
                </span>
              </td>

              <td className="py-4">
                <select className="bg-zinc-800 rounded-lg px-3 py-2">
                  <option>30 Days</option>
                  <option>60 Days</option>
                  <option>90 Days</option>
                  <option>180 Days</option>
                </select>
              </td>
            </tr>

            <tr className="border-b border-zinc-800">
              <td className="py-4">MODERATOR</td>

              <td className="py-4">
                <span className="px-2 py-1 rounded-full bg-yellow-500/10 text-yellow-400 text-xs">
                  STANDARD
                </span>
              </td>

              <td className="py-4">
                <select className="bg-zinc-800 rounded-lg px-3 py-2">
                  <option>14 Days</option>
                  <option>30 Days</option>
                  <option>60 Days</option>
                  <option>90 Days</option>
                </select>
              </td>
            </tr>

            <tr>
              <td className="py-4">ANALYST</td>

              <td className="py-4">
                <span className="px-2 py-1 rounded-full bg-green-500/10 text-green-400 text-xs">
                  RELAXED
                </span>
              </td>

              <td className="py-4">
                <select className="bg-zinc-800 rounded-lg px-3 py-2">
                  <option>30 Days</option>
                  <option>60 Days</option>
                  <option>90 Days</option>
                  <option>180 Days</option>
                </select>
              </td>
            </tr>

          </tbody>

        </table>

      </div>

    </div>
  );
}
