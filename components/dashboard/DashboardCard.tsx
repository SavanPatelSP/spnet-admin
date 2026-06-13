export default function DashboardCard({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <div
className="
group
rounded-3xl
border
border-zinc-800
bg-zinc-900/60
backdrop-blur-xl
p-6
shadow-2xl
hover:border-zinc-700
hover:-translate-y-1
transition-all
duration-300
"
    >
<p className="text-zinc-500 uppercase tracking-wider text-xs">
        {title}
      </p>

<h2 className="text-6xl font-black mt-4 tracking-tight">
  {value}
</h2>

<p className="text-green-400 text-sm mt-2">
  +12.4% this month
</p>
    </div>
  );
}
