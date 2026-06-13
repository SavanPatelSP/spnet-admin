import DashboardCard from "./DashboardCard";

export default function StatsGrid() {
  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
      <DashboardCard title="Users" value="12,481" />
      <DashboardCard title="Revenue" value="$4,218" />
      <DashboardCard title="Premium" value="1,283" />
      <DashboardCard title="Reports" value="42" />
    </div>
  );
}
