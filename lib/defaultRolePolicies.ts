import { UserRole } from "@/types/roles";
import { SecurityPolicy } from "@/types/securityPolicy";

export const rolePolicies = {
  [UserRole.OWNER]:
    SecurityPolicy.HIGH,

  [UserRole.SUPER_ADMIN]:
    SecurityPolicy.HIGH,

  [UserRole.DEVELOPER]:
    SecurityPolicy.HIGH,

  [UserRole.BILLING_MANAGER]:
    SecurityPolicy.HIGH,

  [UserRole.COMMUNITY_MANAGER]:
    SecurityPolicy.STANDARD,

  [UserRole.SUPPORT_MANAGER]:
    SecurityPolicy.STANDARD,

  [UserRole.MODERATOR]:
    SecurityPolicy.STANDARD,

  [UserRole.SUPPORT_AGENT]:
    SecurityPolicy.RELAXED,

  [UserRole.ANALYST]:
    SecurityPolicy.RELAXED,
};
