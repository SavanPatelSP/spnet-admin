const contentQueue = [
  {
    id: "#C1021",
    type: "Post",
    author: "john",
    status: "Pending",
  },
  {
    id: "#C1020",
    type: "Photo",
    author: "alex",
    status: "Flagged",
  },
  {
    id: "#C1019",
    type: "Message",
    author: "mike",
    status: "Review",
  },
];

export default function ContentPage() {
  return (
    <div className="space-y-8">

      <div>
        <h1 className="text-5xl font-black">
          Content Moderation
        </h1>

        <p className="text-zinc-400 mt-2">
          Review flagged content and moderation actions
        </p>
      </div>

      <div className="grid md:grid-cols-4 gap-6">

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
          <p className="text-zinc-400">Pending Reviews</p>
          <h2 className="text-4xl font-black mt-2">127</h2>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
          <p className="text-zinc-400">Flagged Posts</p>
          <h2 className="text-4xl font-black mt-2">43</h2>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
          <p className="text-zinc-400">Removed Today</p>
          <h2 className="text-4xl font-black mt-2">18</h2>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
          <p className="text-zinc-400">Appeals Open</p>
          <h2 className="text-4xl font-black mt-2">6</h2>
        </div>

      </div>

      <div className="rounded-3xl border border-zinc-800 bg-zinc-900 overflow-hidden">

        <table className="w-full">

          <thead className="bg-zinc-800/70">
            <tr>
              <th className="text-left p-4">ID</th>
              <th className="text-left p-4">Type</th>
              <th className="text-left p-4">Author</th>
              <th className="text-left p-4">Status</th>
              <th className="text-left p-4">Action</th>
            </tr>
          </thead>

          <tbody>
            {contentQueue.map((item) => (
              <tr
                key={item.id}
                className="border-t border-zinc-800"
              >
                <td className="p-4">{item.id}</td>
                <td className="p-4">{item.type}</td>
                <td className="p-4">{item.author}</td>
                <td className="p-4">{item.status}</td>

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
