import StatsGrid from "@/components/dashboard/StatsGrid";
import RevenueChart from "@/components/dashboard/RevenueChart";
import {
  Users,
  FileText,
  Shield,
  CreditCard,
} from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="space-y-8">

      <div className="rounded-3xl border border-zinc-800 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 p-8">
        <h1 className="text-4xl font-black">
          Dashboard Overview
        </h1>

        <p className="text-zinc-400 mt-2">
          Monitor platform health, security and growth in real time.
        </p>
      </div>

      <StatsGrid />

      <RevenueChart />

      <div>
        <h2 className="text-2xl font-bold mb-4">
          Quick Actions
        </h2>

        <div className="grid md:grid-cols-4 gap-6">

          <a
            href="/users"
            className="
              rounded-3xl
              bg-zinc-900
              border border-zinc-800
              p-6
              text-left
              hover:border-zinc-700
              hover:-translate-y-1
              hover:shadow-2xl
              transition-all
              block
            "
          >
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center">
              <Users size={24} className="text-blue-400" />
            </div>

            <h3 className="mt-4 font-semibold">
              Manage Users
            </h3>

            <p className="text-zinc-500 text-sm mt-2">
              View, ban and manage platform users
            </p>
          </a>

          <a
            href="/reports"
            className="
              rounded-3xl
              bg-zinc-900
              border border-zinc-800
              p-6
              text-left
              hover:border-zinc-700
              hover:-translate-y-1
              hover:shadow-2xl
              transition-all
              block
            "
          >
            <div className="w-12 h-12 rounded-2xl bg-yellow-500/10 flex items-center justify-center">
              <FileText size={24} className="text-yellow-400" />
            </div>

            <h3 className="mt-4 font-semibold">
              Review Reports
            </h3>

            <p className="text-zinc-500 text-sm mt-2">
              Review abuse and fraud reports
            </p>
          </a>

          <a
            href="/security"
            className="
              rounded-3xl
              bg-zinc-900
              border border-zinc-800
              p-6
              text-left
              hover:border-zinc-700
              hover:-translate-y-1
              hover:shadow-2xl
              transition-all
              block
            "
          >
            <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center">
              <Shield size={24} className="text-green-400" />
            </div>

            <h3 className="mt-4 font-semibold">
              Security Center
            </h3>

            <p className="text-zinc-500 text-sm mt-2">
              Monitor threats and alerts
            </p>
          </a>

          <a
            href="/revenue"
            className="
              rounded-3xl
              bg-zinc-900
              border border-zinc-800
              p-6
              text-left
              hover:border-zinc-700
              hover:-translate-y-1
              hover:shadow-2xl
              transition-all
              block
            "
          >
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center">
              <CreditCard size={24} className="text-purple-400" />
            </div>

            <h3 className="mt-4 font-semibold">
              Revenue
            </h3>

            <p className="text-zinc-500 text-sm mt-2">
              Track earnings and subscriptions
            </p>
          </a>

        </div>
      </div>

      <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
        <h2 className="text-xl font-semibold mb-4">
          Recent Reports
        </h2>

        <div className="space-y-3">

          <div className="flex justify-between items-center">
            <span>Fraud Report #R1021</span>

            <span className="px-2 py-1 rounded-full bg-red-500/10 text-red-400 text-xs">
              High
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span>Spam Report #R1020</span>

            <span className="px-2 py-1 rounded-full bg-yellow-500/10 text-yellow-400 text-xs">
              Medium
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span>Abuse Report #R1019</span>

            <span className="px-2 py-1 rounded-full bg-green-500/10 text-green-400 text-xs">
              Resolved
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span>Content Appeal #R1018</span>

            <span className="px-2 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs">
              Review
            </span>
          </div>

        </div>
      </div>

    </div>
  );
}
