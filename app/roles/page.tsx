import { UserRole } from "@/types/roles";

const roles = [
  UserRole.OWNER,
  UserRole.SUPER_ADMIN,
  UserRole.DEVELOPER,
  UserRole.BILLING_MANAGER,
  UserRole.COMMUNITY_MANAGER,
  UserRole.SUPPORT_MANAGER,
  UserRole.SUPPORT_AGENT,
  UserRole.MODERATOR,
  UserRole.ANALYST,
];

export default function RolesPage() {
  return (
    <div className="space-y-6">

      <div>
        <h1 className="text-3xl font-bold">
          Role Management
        </h1>

        <p className="text-zinc-500 mt-2">
          Manage team permissions and access.
        </p>
      </div>

      <div className="grid gap-4">
        {roles.map((role) => (
          <div
            key={role}
            className="
              rounded-2xl
              border
              border-zinc-800
              bg-zinc-900
              p-5
            "
          >
            <div className="font-semibold">
              {role}
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
