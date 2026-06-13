const reports = [
  {
    id: "#R1021",
    user: "john",
    type: "Spam",
    status: "Open",
  },
  {
    id: "#R1020",
    user: "alex",
    type: "Fraud",
    status: "Investigating",
  },
  {
    id: "#R1019",
    user: "mike",
    type: "Abuse",
    status: "Resolved",
  },
];

export default function ReportsPage() {
  return (
    <div className="space-y-8">

      <div>
        <h1 className="text-5xl font-black">
          Reports Center
        </h1>

        <p className="text-zinc-400 mt-2">
          Review abuse, fraud and spam reports
        </p>
      </div>

      <div className="rounded-3xl border border-zinc-800 bg-zinc-900 overflow-hidden">

        <table className="w-full">

          <thead className="bg-zinc-800/70">
            <tr>
              <th className="text-left p-4">Report ID</th>
              <th className="text-left p-4">User</th>
              <th className="text-left p-4">Type</th>
              <th className="text-left p-4">Status</th>
              <th className="text-left p-4">Action</th>
            </tr>
          </thead>

          <tbody>
            {reports.map((report) => (
              <tr
                key={report.id}
                className="border-t border-zinc-800"
              >
                <td className="p-4">{report.id}</td>
                <td className="p-4">{report.user}</td>
                <td className="p-4">{report.type}</td>
                <td className="p-4">{report.status}</td>

                <td className="p-4">
                  <button className="px-3 py-1 rounded-lg bg-zinc-800">
                    Review
                  </button>
                </td>

              </tr>
            ))}
          </tbody>

        </table>

      </div>

    </div>
  );
}
