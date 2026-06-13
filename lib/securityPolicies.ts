import { SecurityPolicy } from "@/types/securityPolicy";

export const securityPolicies = {
  [SecurityPolicy.HIGH]: {
    days: 7,
  },

  [SecurityPolicy.STANDARD]: {
    days: 14,
  },

  [SecurityPolicy.RELAXED]: {
    days: 30,
  },

  [SecurityPolicy.CUSTOM]: {
    days: 0,
  },
};
